package com.proyecto.diego.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.proyecto.diego.dto.Request.CounterSaleRequestDTO;
import com.proyecto.diego.dto.Request.OrderItemRequestDTO;
import com.proyecto.diego.dto.Request.OrderRequestDTO;
import com.proyecto.diego.dto.Request.PayOrderRequestDTO;
import com.proyecto.diego.dto.Response.OrderItemResponseDTO;
import com.proyecto.diego.dto.Response.OrderResponseDTO;
import com.proyecto.diego.entity.Order;
import com.proyecto.diego.entity.OrderItem;
import com.proyecto.diego.entity.OrderStatus;
import com.proyecto.diego.entity.PaymentMethod;
import com.proyecto.diego.entity.Product;
import com.proyecto.diego.entity.SaleChannel;
import com.proyecto.diego.repository.OrderRepository;
import com.proyecto.diego.repository.ProductsRepository;

import lombok.RequiredArgsConstructor;

/**
 * Ciclo de una venta:
 * - Web: el cliente crea el pedido (PENDIENTE); el cajero lo cobra y despacha
 *   (PAGADA) o lo anula (ANULADA).
 * - Mostrador: el cajero la arma y la cobra en un solo paso (nace PAGADA).
 * El stock solo se descuenta al pasar a PAGADA: un pedido web sin cobrar no
 * bloquea inventario.
 */
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductsRepository productsRepository;

    // El precio y el nombre siempre se toman del producto en la base de datos,
    // nunca de lo que mande el cliente: evita que alguien manipule el pedido
    // enviando un precio distinto al real.
    public OrderResponseDTO createOrder(OrderRequestDTO request) {
        Order order = new Order();
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setChannel(SaleChannel.WEB);
        order.setStatus(OrderStatus.PENDIENTE);
        fillItems(order, request.getItems());

        orderRepository.save(order);

        return toResponse(order);
    }

    public List<OrderResponseDTO> listOrders(OrderStatus status) {
        List<Order> orders = status == null
                ? orderRepository.findAllByOrderByCreatedAtDesc()
                : orderRepository.findAllByStatusOrderByCreatedAtDesc(status);

        return orders.stream().map(this::toResponse).toList();
    }

    // Cobra y despacha un pedido web pendiente.
    @Transactional
    public OrderResponseDTO payOrder(Long id, PayOrderRequestDTO request, String cashierUsername) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        if (order.getStatus() != OrderStatus.PENDIENTE) {
            throw new RuntimeException(alreadyClosedMessage(order));
        }

        settle(order, request.getPaymentMethod(), request.getAmountReceived(), cashierUsername);
        orderRepository.save(order);

        return toResponse(order);
    }

    // Venta armada en el mostrador: se crea ya cobrada.
    @Transactional
    public OrderResponseDTO createCounterSale(CounterSaleRequestDTO request, String cashierUsername) {
        Order order = new Order();
        String name = request.getCustomerName();
        order.setCustomerName(name == null || name.isBlank() ? "Cliente de mostrador" : name.trim());
        String phone = request.getCustomerPhone();
        order.setCustomerPhone(phone == null ? "" : phone.trim());
        order.setChannel(SaleChannel.MOSTRADOR);
        fillItems(order, request.getItems());

        settle(order, request.getPaymentMethod(), request.getAmountReceived(), cashierUsername);
        orderRepository.save(order);

        return toResponse(order);
    }

    // Solo un pedido pendiente se puede anular: todavía no movió stock ni dinero.
    @Transactional
    public OrderResponseDTO cancelOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        if (order.getStatus() != OrderStatus.PENDIENTE) {
            throw new RuntimeException(alreadyClosedMessage(order));
        }

        order.setStatus(OrderStatus.ANULADA);
        order.setCancelledAt(LocalDateTime.now());
        orderRepository.save(order);

        return toResponse(order);
    }

    private String alreadyClosedMessage(Order order) {
        return order.getStatus() == OrderStatus.PAGADA
                ? "El pedido ya fue cobrado."
                : "El pedido ya fue anulado.";
    }

    // Arma las líneas con el precio y el nombre actuales del producto.
    private void fillItems(Order order, List<OrderItemRequestDTO> itemRequests) {
        List<OrderItem> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (OrderItemRequestDTO itemRequest : itemRequests) {
            Product product = productsRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProductId(product.getId());
            item.setProductName(product.getName());
            item.setUnitPrice(product.getPrice());
            item.setQuantity(itemRequest.getQuantity());
            item.setSubtotal(subtotal);
            items.add(item);

            total = total.add(subtotal);
        }

        order.setItems(items);
        order.setTotal(total);
    }

    // Registra el pago, calcula el cambio y descuenta el stock. Se llama dentro
    // de una transacción: si falta stock de cualquier línea, no se guarda nada.
    private void settle(Order order, PaymentMethod method, BigDecimal amountReceived, String cashierUsername) {
        BigDecimal total = order.getTotal();

        if (method == PaymentMethod.EFECTIVO) {
            if (amountReceived == null) {
                throw new RuntimeException("Ingresa cuánto dinero entregó el cliente.");
            }
            if (amountReceived.compareTo(total) < 0) {
                throw new RuntimeException("El dinero recibido no alcanza para el total de la venta.");
            }
            order.setAmountReceived(amountReceived);
            order.setChangeGiven(amountReceived.subtract(total));
        } else {
            // Tarjeta o transferencia: se cobra el total exacto, no hay cambio.
            order.setAmountReceived(total);
            order.setChangeGiven(BigDecimal.ZERO);
        }

        for (OrderItem item : order.getItems()) {
            // Un producto borrado después del pedido ya no tiene stock que descontar.
            if (item.getProductId() == null) {
                continue;
            }
            productsRepository.findByIdForUpdate(item.getProductId()).ifPresent(product -> {
                if (product.getStock() < item.getQuantity()) {
                    throw new RuntimeException("Stock insuficiente de " + product.getName()
                            + ": quedan " + product.getStock() + ".");
                }
                product.setStock(product.getStock() - item.getQuantity());
                productsRepository.save(product);
            });
        }

        order.setPaymentMethod(method);
        order.setStatus(OrderStatus.PAGADA);
        order.setPaidAt(LocalDateTime.now());
        order.setCashierUsername(cashierUsername);
    }

    // Público para que los reportes muestren los pedidos del día con el mismo formato.
    public OrderResponseDTO toResponse(Order order) {
        List<OrderItemResponseDTO> items = order.getItems().stream()
                .map(item -> OrderItemResponseDTO.builder()
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .build())
                .toList();

        return OrderResponseDTO.builder()
                .id(order.getId())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .total(order.getTotal())
                .createdAt(order.getCreatedAt())
                .items(items)
                .status(order.getStatus().name())
                .channel(order.getChannel().name())
                .paymentMethod(order.getPaymentMethod() == null ? null : order.getPaymentMethod().name())
                .amountReceived(order.getAmountReceived())
                .changeGiven(order.getChangeGiven())
                .paidAt(order.getPaidAt())
                .cashierUsername(order.getCashierUsername())
                .cancelledAt(order.getCancelledAt())
                .build();
    }
}
