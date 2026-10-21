package com.proyecto.diego.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import com.proyecto.diego.entity.Order;
import com.proyecto.diego.entity.OrderStatus;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findAllByStatusOrderByCreatedAtDesc(OrderStatus status);

    // Reportes: ventas cobradas en un rango (se cuentan por fecha de pago).
    List<Order> findAllByStatusAndPaidAtBetweenOrderByPaidAtAsc(OrderStatus status, LocalDateTime from, LocalDateTime to);

    // Pedidos del día, en cualquier estado.
    List<Order> findAllByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime from, LocalDateTime to);

    // Los pedidos que existían antes de los estados quedaron PAGADA sin fecha
    // de pago: se usa su fecha de creación para que caigan en el día correcto.
    @Modifying
    @Transactional
    @Query("update Order o set o.paidAt = o.createdAt where o.status = com.proyecto.diego.entity.OrderStatus.PAGADA and o.paidAt is null")
    int backfillPaidAt();
}
