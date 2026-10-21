package com.proyecto.diego.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.diego.dto.Request.CounterSaleRequestDTO;
import com.proyecto.diego.dto.Request.OrderRequestDTO;
import com.proyecto.diego.dto.Request.PayOrderRequestDTO;
import com.proyecto.diego.dto.Response.GlobalResponseDTO;
import com.proyecto.diego.dto.Response.OrderResponseDTO;
import com.proyecto.diego.entity.OrderStatus;
import com.proyecto.diego.service.OrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * POST /orders es público (SecurityConfig): cualquier visitante confirma un
 * pedido web, que queda PENDIENTE hasta que el cajero lo cobre. Todo lo demás
 * (listar, cobrar, anular, vender en mostrador) es para CAJERO o SUPER_ADMIN.
 * El cajero que cobra se toma del usuario autenticado, nunca del cuerpo de la
 * petición.
 */
@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<GlobalResponseDTO<OrderResponseDTO>> createOrder(@Valid @RequestBody OrderRequestDTO request) {
        OrderResponseDTO response = orderService.createOrder(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
            GlobalResponseDTO.<OrderResponseDTO>builder()
                            .message("Pedido registrado correctamente")
                            .data(response)
                            .build()
        );
    }

    // ?status=PENDIENTE para la cola del cajero; sin filtro trae todo el historial.
    @GetMapping
    public ResponseEntity<GlobalResponseDTO<List<OrderResponseDTO>>> listOrders(
            @RequestParam(required = false) OrderStatus status) {
        List<OrderResponseDTO> orders = orderService.listOrders(status);

        return ResponseEntity.ok(
            GlobalResponseDTO.<List<OrderResponseDTO>>builder()
                            .message("Lista de pedidos obtenida correctamente")
                            .data(orders)
                            .build()
        );
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<GlobalResponseDTO<OrderResponseDTO>> payOrder(
            @PathVariable Long id,
            @Valid @RequestBody PayOrderRequestDTO request,
            Authentication authentication) {
        OrderResponseDTO response = orderService.payOrder(id, request, authentication.getName());

        return ResponseEntity.ok(
            GlobalResponseDTO.<OrderResponseDTO>builder()
                            .message("Pedido cobrado y despachado")
                            .data(response)
                            .build()
        );
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<GlobalResponseDTO<OrderResponseDTO>> cancelOrder(@PathVariable Long id) {
        OrderResponseDTO response = orderService.cancelOrder(id);

        return ResponseEntity.ok(
            GlobalResponseDTO.<OrderResponseDTO>builder()
                            .message("Pedido anulado")
                            .data(response)
                            .build()
        );
    }

    @PostMapping("/counter")
    public ResponseEntity<GlobalResponseDTO<OrderResponseDTO>> createCounterSale(
            @Valid @RequestBody CounterSaleRequestDTO request,
            Authentication authentication) {
        OrderResponseDTO response = orderService.createCounterSale(request, authentication.getName());

        return ResponseEntity.status(HttpStatus.CREATED).body(
            GlobalResponseDTO.<OrderResponseDTO>builder()
                            .message("Venta de mostrador registrada")
                            .data(response)
                            .build()
        );
    }
}
