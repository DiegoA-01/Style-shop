package com.proyecto.diego.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    @Column(name = "customer_phone", nullable = false, length = 30)
    private String customerPhone;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal total;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Los DEFAULT permiten que Hibernate agregue las columnas sobre filas ya
    // existentes: los pedidos anteriores a este cambio quedan como ventas web
    // pagadas, para que sigan contando en los reportes. Los pedidos nuevos
    // siempre setean el estado explícitamente.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'PAGADA'")
    private OrderStatus status = OrderStatus.PENDIENTE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'WEB'")
    private SaleChannel channel = SaleChannel.WEB;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod;

    // Solo en efectivo: lo que entregó el cliente y el cambio devuelto.
    @Column(name = "amount_received", precision = 12, scale = 3)
    private BigDecimal amountReceived;

    @Column(name = "change_given", precision = 12, scale = 3)
    private BigDecimal changeGiven;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    // Se guarda el nombre de usuario (no una relación) para que el historial
    // no cambie si la cuenta del cajero se elimina después.
    @Column(name = "cashier_username", length = 50)
    private String cashierUsername;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
