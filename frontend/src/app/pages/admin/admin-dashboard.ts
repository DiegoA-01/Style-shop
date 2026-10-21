import { Component, ElementRef, HostListener, NgZone, OnDestroy, afterNextRender, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../services/report.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { DailyReport, MonthlyReport, ProductRanking, YearReport } from '../../models/report.model';
import { OrderStatus } from '../../models/order.model';
import { UserAccount } from '../../models/user.model';
import { CopCurrencyPipe } from '../../shared/cop-currency.pipe';
import { BarChart, BarItem } from '../../shared/bar-chart';
import { RevealDirective } from '../../shared/reveal.directive';
import { CountUpDirective } from '../../shared/count-up.directive';
import { SilkRibbon } from '../../shared/silk-ribbon';
import { UserForm } from '../user-form/user-form';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Fecha local en formato YYYY-MM-DD (toISOString usaría UTC y en la noche
// de Colombia ya sería "mañana").
function fechaLocal(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function moverDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  return fechaLocal(new Date(y, m - 1, d + dias));
}

const signo = (n: number) => (n > 0 ? '+' : '') + n.toLocaleString('es-CO', { maximumFractionDigits: 1 });

export const SECCIONES = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'dia', label: 'El día' },
  { id: 'tendencia', label: 'Tendencia' },
  { id: 'equipo', label: 'Equipo' },
] as const;

// Inicio del super admin: lo vendido en el día (producto por producto),
// los pedidos del día, la gráfica mes a mes y año a año, el producto más y
// menos vendido, y el equipo.
@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, DatePipe, CopCurrencyPipe, BarChart, RevealDirective, CountUpDirective, SilkRibbon, UserForm],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnDestroy {
  private reportService = inject(ReportService);
  private userService = inject(UserService);
  protected authService = inject(AuthService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private cleanups: Array<() => void> = [];

  readonly hoy = fechaLocal(new Date());
  readonly secciones = SECCIONES;

  fecha = signal(this.hoy);
  anio = signal(new Date().getFullYear());

  daily = signal<DailyReport | null>(null);
  // Día anterior al elegido, solo para la comparación "frente a ayer".
  prevDaily = signal<DailyReport | null>(null);
  monthly = signal<MonthlyReport | null>(null);
  yearly = signal<YearReport[] | null>(null);
  ranking = signal<ProductRanking | null>(null);
  users = signal<UserAccount[] | null>(null);
  cargandoDia = signal(true);
  error = signal<string | null>(null);

  mostrarFormulario = signal(false);
  seccionActiva = signal<string>('resumen');

  // Mismo formato de moneda que el resto de la tienda (ejes, etiquetas, cifras).
  private readonly copPipe = new CopCurrencyPipe();
  readonly moneda = (value: number) => this.copPipe.transform(value);
  readonly entero = (value: number) => Math.round(value).toLocaleString('es-CO');

  saludo = computed(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  });

  esHoy = computed(() => this.fecha() === this.hoy);
  esAyer = computed(() => this.fecha() === moverDias(this.hoy, -1));
  fechaDate = computed(() => {
    const [y, m, d] = this.fecha().split('-').map(Number);
    return new Date(y, m - 1, d);
  });
  hoyDate = new Date();

  // Cómo nombrar el día elegido en los títulos.
  nombreDia = computed(() => (this.esHoy() ? 'hoy' : this.esAyer() ? 'ayer' : 'ese día'));

  // Variación del total contra el día anterior. null si el anterior no vendió.
  delta = computed(() => {
    const d = this.daily(), p = this.prevDaily();
    if (!d || !p) return null;
    const actual = Number(d.total), antes = Number(p.total);
    if (antes === 0) return actual === 0 ? null : { pct: null, sube: true };
    const pct = ((actual - antes) / antes) * 100;
    return { pct: Math.round(pct * 10) / 10, sube: pct >= 0 };
  });

  mesesChart = computed<BarItem[]>(() => {
    const m = this.monthly();
    if (!m) return [];
    const now = new Date();
    const mesActual = m.year === now.getFullYear() ? now.getMonth() + 1 : m.year > now.getFullYear() ? 0 : 13;
    return m.months.map(mes => ({
      label: MESES[mes.month - 1],
      value: Number(mes.total),
      // Un mes que no ha llegado no "cayó un 100%": simplemente no ha empezado.
      detail: mes.month > mesActual ? ['Todavía no llega'] : [
        ...(mes.month === mesActual ? ['Mes en curso'] : []),
        `${mes.share.toLocaleString('es-CO', { maximumFractionDigits: 1 })}% de lo vendido en ${m.year}`,
        mes.growth === null
          ? `Sin ventas en ${mes.month === 1 ? 'diciembre anterior' : MESES_LARGOS[mes.month - 2]} para comparar`
          : `${signo(mes.growth)}% frente a ${mes.month === 1 ? 'diciembre anterior' : MESES_LARGOS[mes.month - 2]}`,
        `${mes.salesCount} ${mes.salesCount === 1 ? 'venta' : 'ventas'}`,
      ],
    }));
  });

  // El mes con más ventas del año, para el texto bajo la gráfica.
  mejorMes = computed(() => {
    const m = this.monthly();
    if (!m || Number(m.yearTotal) === 0) return null;
    const top = [...m.months].sort((a, b) => Number(b.total) - Number(a.total))[0];
    return { nombre: MESES_LARGOS[top.month - 1], share: top.share };
  });

  aniosChart = computed<BarItem[]>(() =>
    (this.yearly() ?? []).map(y => ({
      label: String(y.year),
      value: Number(y.total),
      detail: [
        y.growth === null ? 'Primer año con ventas' : `${signo(y.growth)}% frente a ${y.year - 1}`,
        `${y.salesCount} ${y.salesCount === 1 ? 'venta' : 'ventas'}`,
      ],
    })),
  );

  // Resumen del año elegido para la tarjeta "año a año".
  resumenAnio = computed(() => {
    const m = this.monthly();
    if (!m) return null;
    const total = Number(m.yearTotal);
    return {
      ventas: m.salesCount,
      ticket: m.salesCount ? total / m.salesCount : 0,
      mesesConVentas: m.months.filter(x => Number(x.total) > 0).length,
    };
  });

  aniosDisponibles = computed(() => {
    const years = (this.yearly() ?? []).map(y => y.year);
    const actual = new Date().getFullYear();
    return [...new Set([actual, ...years])].sort((a, b) => b - a);
  });

  // Pendientes primero: es lo que todavía hay que cobrar.
  pedidosOrdenados = computed(() => {
    const orden: Record<OrderStatus, number> = { PENDIENTE: 0, PAGADA: 1, ANULADA: 2 };
    return [...(this.daily()?.orders ?? [])].sort((a, b) => orden[a.status] - orden[b.status]);
  });

  pedidosPorEstado = computed(() => {
    const orders = this.daily()?.orders ?? [];
    return {
      PENDIENTE: orders.filter(o => o.status === 'PENDIENTE').length,
      PAGADA: orders.filter(o => o.status === 'PAGADA').length,
      ANULADA: orders.filter(o => o.status === 'ANULADA').length,
    };
  });

  equipo = computed(() => {
    const list = this.users() ?? [];
    return {
      empleados: list.filter(u => u.role === 'TRABAJADOR').length,
      cajeros: list.filter(u => u.role === 'CAJERO').length,
      admins: list.filter(u => u.role === 'SUPER_ADMIN').length,
      clientes: list.filter(u => u.role === 'USUARIO').length,
    };
  });

  constructor() {
    this.cargarDia();
    this.cargarAnio();
    this.cargarEquipo();
    this.reportService.getYearly().subscribe({
      next: r => this.yearly.set(r.data),
      error: err => this.error.set(err.message),
    });
    afterNextRender(() => this.zone.runOutsideAngular(() => this.initSecciones()));
  }

  ngOnDestroy(): void {
    this.cleanups.forEach(fn => fn());
  }

  cambiarFecha(value: string): void {
    if (!value || value === this.fecha() || value > this.hoy) return;
    this.fecha.set(value);
    this.cargarDia();
  }

  moverDia(dias: number): void {
    this.cambiarFecha(moverDias(this.fecha(), dias));
  }

  cambiarAnio(value: string): void {
    this.anio.set(Number(value));
    this.cargarAnio();
  }

  // Al recargar se conserva lo anterior (atenuado) en vez de vaciar la pantalla.
  cargarDia(): void {
    this.cargandoDia.set(true);
    this.reportService.getDaily(this.fecha()).subscribe({
      next: r => {
        this.daily.set(r.data);
        this.cargandoDia.set(false);
      },
      error: err => {
        this.error.set(err.message);
        this.cargandoDia.set(false);
      },
    });
    this.reportService.getDaily(moverDias(this.fecha(), -1)).subscribe({
      next: r => this.prevDaily.set(r.data),
      error: () => this.prevDaily.set(null),
    });
  }

  cargarAnio(): void {
    this.reportService.getMonthly(this.anio()).subscribe({
      next: r => this.monthly.set(r.data),
      error: err => this.error.set(err.message),
    });
    this.reportService.getProducts(this.anio()).subscribe({
      next: r => this.ranking.set(r.data),
      error: err => this.error.set(err.message),
    });
  }

  cargarEquipo(): void {
    this.userService.getUsers().subscribe({
      next: r => this.users.set(r.data),
      error: () => this.users.set([]),
    });
  }

  irA(id: string, event: Event): void {
    event.preventDefault();
    const target = this.host.nativeElement.querySelector<HTMLElement>('#' + id);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    target?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    target?.focus({ preventScroll: true });
  }

  estadoLabel(status: OrderStatus): string {
    return { PENDIENTE: 'Pendiente', PAGADA: 'Pagada', ANULADA: 'Anulada' }[status];
  }

  pagoLabel(method: string | null): string {
    if (!method) return 'Sin registrar';
    return { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia' }[method] ?? method;
  }

  canalLabel(channel: string): string {
    return channel === 'MOSTRADOR' ? 'Mostrador' : 'Web';
  }

  trabajadorCreado(): void {
    this.mostrarFormulario.set(false);
    this.cargarEquipo();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.mostrarFormulario.set(false);
  }

  // La barra de secciones queda pegada bajo el nav y marca la sección visible.
  private initSecciones(): void {
    const root = this.host.nativeElement;
    const nav = document.querySelector<HTMLElement>('.glass-nav');
    if (nav) {
      const ro = new ResizeObserver(() => root.style.setProperty('--nav-h', nav.offsetHeight + 24 + 'px'));
      ro.observe(nav);
      this.cleanups.push(() => ro.disconnect());
    }

    const io = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) this.zone.run(() => this.seccionActiva.set(visible.target.id));
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    this.secciones.forEach(s => {
      const el = root.querySelector('#' + s.id);
      if (el) io.observe(el);
    });

    // La última sección es corta: al llegar al final de la página se marca ella.
    const ultima = this.secciones[this.secciones.length - 1].id;
    const onScroll = () => {
      const alFinal = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
      if (alFinal && this.seccionActiva() !== ultima) this.zone.run(() => this.seccionActiva.set(ultima));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    this.cleanups.push(() => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    });
  }
}
