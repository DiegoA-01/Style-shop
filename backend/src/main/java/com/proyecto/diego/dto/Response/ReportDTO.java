package com.proyecto.diego.dto.Response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Respuestas de /reports (solo SUPER_ADMIN). Son de solo lectura, así que se
 * agrupan como records en un único archivo. Todas cuentan únicamente ventas
 * PAGADA, por su fecha de pago.
 */
public final class ReportDTO {

    private ReportDTO() {
    }

    // Una línea vendida: qué producto, a qué precio, cuántas unidades y cuándo.
    public record SaleLine(
            Long orderId,
            LocalDateTime paidAt,
            String productName,
            BigDecimal unitPrice,
            Integer quantity,
            BigDecimal subtotal,
            String channel,
            String paymentMethod,
            String cashierUsername) {
    }

    // Lo vendido en un día, más todos los pedidos creados ese día (cualquier estado).
    public record Daily(
            LocalDate date,
            BigDecimal total,
            long salesCount,
            long unitsSold,
            BigDecimal averageTicket,
            BigDecimal monthTotal,
            BigDecimal yearTotal,
            List<SaleLine> lines,
            List<OrderResponseDTO> orders) {
    }

    // Un mes del año. share = porcentaje del total del año (los 12 suman 100);
    // growth = variación contra el mes anterior (null si el anterior fue 0).
    public record Month(
            int month,
            BigDecimal total,
            long salesCount,
            BigDecimal share,
            BigDecimal growth) {
    }

    public record Monthly(
            int year,
            BigDecimal yearTotal,
            long salesCount,
            List<Month> months) {
    }

    // growth = variación contra el año anterior (null si no hay año anterior con ventas).
    public record Year(
            int year,
            BigDecimal total,
            long salesCount,
            BigDecimal growth) {
    }

    // Ranking de productos del año. Incluye los que no vendieron nada, para
    // que el "menos vendido" sea honesto.
    public record ProductSales(
            Long productId,
            String productName,
            long unitsSold,
            BigDecimal revenue) {
    }

    public record ProductRanking(
            int year,
            ProductSales best,
            ProductSales worst,
            List<ProductSales> products) {
    }
}
