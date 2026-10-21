package com.proyecto.diego.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.stereotype.Service;

import com.proyecto.diego.dto.Response.OrderResponseDTO;
import com.proyecto.diego.dto.Response.ReportDTO;
import com.proyecto.diego.entity.Order;
import com.proyecto.diego.entity.OrderItem;
import com.proyecto.diego.entity.OrderStatus;
import com.proyecto.diego.entity.Product;
import com.proyecto.diego.repository.OrderRepository;
import com.proyecto.diego.repository.ProductsRepository;

import lombok.RequiredArgsConstructor;

/**
 * Estadísticas de venta para el super admin. Solo cuentan las ventas PAGADA,
 * agrupadas por su fecha de pago; un pedido pendiente o anulado no es venta.
 * Los agregados se calculan en memoria: con el volumen de una tienda es más
 * simple y legible que SQL por reporte, y todos comparten la misma regla.
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final OrderRepository orderRepository;
    private final ProductsRepository productsRepository;
    private final OrderService orderService;

    public ReportDTO.Daily daily(LocalDate date) {
        List<Order> sales = paidBetween(date.atStartOfDay(), date.atTime(LocalTime.MAX));

        List<ReportDTO.SaleLine> lines = new ArrayList<>();
        long units = 0;
        for (Order order : sales) {
            for (OrderItem item : order.getItems()) {
                units += item.getQuantity();
                lines.add(new ReportDTO.SaleLine(
                        order.getId(),
                        order.getPaidAt(),
                        item.getProductName(),
                        item.getUnitPrice(),
                        item.getQuantity(),
                        item.getSubtotal(),
                        order.getChannel().name(),
                        order.getPaymentMethod() == null ? null : order.getPaymentMethod().name(),
                        order.getCashierUsername()));
            }
        }

        BigDecimal total = sum(sales);
        BigDecimal average = sales.isEmpty()
                ? BigDecimal.ZERO
                : total.divide(BigDecimal.valueOf(sales.size()), 3, RoundingMode.HALF_UP);

        LocalDate monthStart = date.withDayOfMonth(1);
        BigDecimal monthTotal = sum(paidBetween(monthStart.atStartOfDay(), date.atTime(LocalTime.MAX)));
        LocalDate yearStart = date.withDayOfYear(1);
        BigDecimal yearTotal = sum(paidBetween(yearStart.atStartOfDay(), date.atTime(LocalTime.MAX)));

        List<OrderResponseDTO> orders = orderRepository
                .findAllByCreatedAtBetweenOrderByCreatedAtDesc(date.atStartOfDay(), date.atTime(LocalTime.MAX))
                .stream()
                .map(orderService::toResponse)
                .toList();

        return new ReportDTO.Daily(date, total, sales.size(), units, average, monthTotal, yearTotal, lines, orders);
    }

    public ReportDTO.Monthly monthly(int year) {
        // Diciembre del año anterior sirve para la variación de enero.
        List<Order> sales = paidBetween(
                LocalDate.of(year - 1, 12, 1).atStartOfDay(),
                LocalDate.of(year, 12, 31).atTime(LocalTime.MAX));

        BigDecimal[] totals = new BigDecimal[13];
        long[] counts = new long[13];
        Arrays.fill(totals, BigDecimal.ZERO);
        BigDecimal previousDecember = BigDecimal.ZERO;

        for (Order order : sales) {
            LocalDateTime paidAt = order.getPaidAt();
            if (paidAt.getYear() == year) {
                int m = paidAt.getMonthValue();
                totals[m] = totals[m].add(order.getTotal());
                counts[m]++;
            } else {
                previousDecember = previousDecember.add(order.getTotal());
            }
        }

        BigDecimal yearTotal = BigDecimal.ZERO;
        long yearCount = 0;
        for (int m = 1; m <= 12; m++) {
            yearTotal = yearTotal.add(totals[m]);
            yearCount += counts[m];
        }

        List<ReportDTO.Month> months = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            BigDecimal previous = m == 1 ? previousDecember : totals[m - 1];
            months.add(new ReportDTO.Month(m, totals[m], counts[m], percent(totals[m], yearTotal), growth(totals[m], previous)));
        }

        return new ReportDTO.Monthly(year, yearTotal, yearCount, months);
    }

    public List<ReportDTO.Year> yearly() {
        Map<Integer, BigDecimal> totals = new TreeMap<>();
        Map<Integer, Long> counts = new TreeMap<>();
        for (Order order : orderRepository.findAllByStatusOrderByCreatedAtDesc(OrderStatus.PAGADA)) {
            if (order.getPaidAt() == null) {
                continue;
            }
            int y = order.getPaidAt().getYear();
            totals.merge(y, order.getTotal(), BigDecimal::add);
            counts.merge(y, 1L, Long::sum);
        }

        List<ReportDTO.Year> years = new ArrayList<>();
        BigDecimal previous = null;
        for (Map.Entry<Integer, BigDecimal> entry : totals.entrySet()) {
            BigDecimal growth = previous == null ? null : growth(entry.getValue(), previous);
            years.add(new ReportDTO.Year(entry.getKey(), entry.getValue(), counts.get(entry.getKey()), growth));
            previous = entry.getValue();
        }
        return years;
    }

    public ReportDTO.ProductRanking products(int year) {
        List<Order> sales = paidBetween(
                LocalDate.of(year, 1, 1).atStartOfDay(),
                LocalDate.of(year, 12, 31).atTime(LocalTime.MAX));

        // Clave: id del producto; si el producto ya se borró, su nombre en la venta.
        Map<String, long[]> units = new LinkedHashMap<>();
        Map<String, BigDecimal> revenue = new LinkedHashMap<>();
        Map<String, ReportDTO.ProductSales> base = new LinkedHashMap<>();

        for (Product product : productsRepository.findAll()) {
            String key = "id:" + product.getId();
            base.put(key, new ReportDTO.ProductSales(product.getId(), product.getName(), 0, BigDecimal.ZERO));
        }

        for (Order order : sales) {
            for (OrderItem item : order.getItems()) {
                String key = item.getProductId() != null && base.containsKey("id:" + item.getProductId())
                        ? "id:" + item.getProductId()
                        : "name:" + item.getProductName();
                base.putIfAbsent(key, new ReportDTO.ProductSales(item.getProductId(), item.getProductName(), 0, BigDecimal.ZERO));
                units.computeIfAbsent(key, k -> new long[1])[0] += item.getQuantity();
                revenue.merge(key, item.getSubtotal(), BigDecimal::add);
            }
        }

        List<ReportDTO.ProductSales> ranking = base.entrySet().stream()
                .map(e -> new ReportDTO.ProductSales(
                        e.getValue().productId(),
                        e.getValue().productName(),
                        units.getOrDefault(e.getKey(), new long[1])[0],
                        revenue.getOrDefault(e.getKey(), BigDecimal.ZERO)))
                .sorted(Comparator.comparingLong(ReportDTO.ProductSales::unitsSold)
                        .thenComparing(ReportDTO.ProductSales::revenue)
                        .reversed())
                .toList();

        // El menos vendido se busca entre los productos que siguen en el catálogo:
        // uno ya borrado no es algo sobre lo que se pueda actuar.
        ReportDTO.ProductSales best = ranking.isEmpty() || ranking.get(0).unitsSold() == 0 ? null : ranking.get(0);
        ReportDTO.ProductSales worst = ranking.stream()
                .filter(p -> p.productId() != null && productsRepository.existsById(p.productId()))
                .reduce((first, second) -> second)
                .orElse(null);

        return new ReportDTO.ProductRanking(year, best, worst, ranking);
    }

    private List<Order> paidBetween(LocalDateTime from, LocalDateTime to) {
        return orderRepository.findAllByStatusAndPaidAtBetweenOrderByPaidAtAsc(OrderStatus.PAGADA, from, to);
    }

    private BigDecimal sum(List<Order> orders) {
        return orders.stream().map(Order::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal percent(BigDecimal part, BigDecimal whole) {
        if (whole.signum() == 0) {
            return BigDecimal.ZERO;
        }
        return part.multiply(HUNDRED).divide(whole, 1, RoundingMode.HALF_UP);
    }

    private BigDecimal growth(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.signum() == 0) {
            return null;
        }
        return current.subtract(previous).multiply(HUNDRED).divide(previous, 1, RoundingMode.HALF_UP);
    }
}
