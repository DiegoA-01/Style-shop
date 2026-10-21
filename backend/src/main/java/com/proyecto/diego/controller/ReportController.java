package com.proyecto.diego.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.diego.dto.Response.GlobalResponseDTO;
import com.proyecto.diego.dto.Response.ReportDTO;
import com.proyecto.diego.service.ReportService;

import lombok.RequiredArgsConstructor;

/**
 * Estadísticas de venta: solo SUPER_ADMIN (SecurityConfig). Sin parámetros,
 * cada reporte usa el día o el año actual.
 */
@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/daily")
    public ResponseEntity<GlobalResponseDTO<ReportDTO.Daily>> daily(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ok("Ventas del día", reportService.daily(date == null ? LocalDate.now() : date));
    }

    @GetMapping("/monthly")
    public ResponseEntity<GlobalResponseDTO<ReportDTO.Monthly>> monthly(@RequestParam(required = false) Integer year) {
        return ok("Ventas mes a mes", reportService.monthly(year == null ? LocalDate.now().getYear() : year));
    }

    @GetMapping("/yearly")
    public ResponseEntity<GlobalResponseDTO<List<ReportDTO.Year>>> yearly() {
        return ok("Ventas por año", reportService.yearly());
    }

    @GetMapping("/products")
    public ResponseEntity<GlobalResponseDTO<ReportDTO.ProductRanking>> products(@RequestParam(required = false) Integer year) {
        return ok("Ranking de productos", reportService.products(year == null ? LocalDate.now().getYear() : year));
    }

    private <T> ResponseEntity<GlobalResponseDTO<T>> ok(String message, T data) {
        return ResponseEntity.ok(GlobalResponseDTO.<T>builder().message(message).data(data).build());
    }
}
