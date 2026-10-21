package com.proyecto.diego.dto.Response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponseDTO {

    private Long id;

    private String customerName;

    private String customerPhone;

    private BigDecimal total;

    private LocalDateTime createdAt;

    private List<OrderItemResponseDTO> items;

    private String status;

    private String channel;

    private String paymentMethod;

    private BigDecimal amountReceived;

    private BigDecimal changeGiven;

    private LocalDateTime paidAt;

    private String cashierUsername;

    private LocalDateTime cancelledAt;
}
