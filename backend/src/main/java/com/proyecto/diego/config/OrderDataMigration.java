package com.proyecto.diego.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.proyecto.diego.repository.OrderRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Ajuste de datos al arrancar: los pedidos anteriores a los estados de venta
 * quedaron como PAGADA (DEFAULT de la columna) pero sin fecha de pago. Se les
 * asigna su fecha de creación para que cuenten en los reportes del día y del
 * mes correctos. No hace nada si ya no quedan pedidos así.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderDataMigration implements CommandLineRunner {

    private final OrderRepository orderRepository;

    @Override
    public void run(String... args) {
        int updated = orderRepository.backfillPaidAt();
        if (updated > 0) {
            log.info("Fecha de pago asignada a {} pedidos anteriores.", updated);
        }
    }
}
