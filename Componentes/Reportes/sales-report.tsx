"use client"

import * as React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { TrendingUp, Calendar, Clock } from "lucide-react"
import { ExportDropdown } from "./export-dropdown"

interface SalesReportProps {
  dateRange: string
  startDate: Date
  endDate: Date
}

export function SalesReport({ dateRange, startDate, endDate }: SalesReportProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Datos de ejemplo para ventas
  const salesData = {
    dailyAverage: 1522667,
    bestDay: { date: "2024-01-15", amount: 2847500 },
    worstDay: { date: "2024-01-08", amount: 890000 },
    peakHour: "19:00 - 20:00",
    paymentMethods: [
      { method: "Efectivo", amount: 18272000, percentage: 40 },
      { method: "Tarjeta Crédito", amount: 13704000, percentage: 30 },
      { method: "Tarjeta Débito", amount: 9136000, percentage: 20 },
      { method: "Transferencia", amount: 4568000, percentage: 10 },
    ],
    topWaiters: [
      { name: "María González", sales: 8450000, orders: 156 },
      { name: "Carlos Rodríguez", sales: 7230000, orders: 142 },
      { name: "Ana Martínez", sales: 6890000, orders: 138 },
      { name: "Luis Hernández", sales: 5670000, orders: 125 },
    ],
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">📊 Reporte de Ventas</h2>
          <p className="text-muted-foreground">Análisis detallado de ventas del período seleccionado</p>
        </div>
        <ExportDropdown
          data={{
            resumen: {
              promedioDiario: salesData.dailyAverage,
              mejorDia: `${formatCurrency(salesData.bestDay.amount)} (${new Date(salesData.bestDay.date).toLocaleDateString("es-CO")})`,
              horaPico: salesData.peakHour,
              periodoAnalizado: dateRange,
            },
            metodosPago: salesData.paymentMethods,
            mejoresMeseros: salesData.topWaiters,
          }}
          filename="reporte_ventas"
          elementId="sales-report-content"
          startDate={startDate}
          endDate={endDate}
          reportTitle="REPORTE DE VENTAS"
        />
      </div>
      <div className="space-y-6" id="sales-report-content">
        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                💰 Promedio Diario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(salesData.dailyAverage)}</div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600">+12.5%</span>
                <span className="text-muted-foreground ml-1">vs período anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                🏆 Mejor Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(salesData.bestDay.amount)}</div>
              <div className="flex items-center mt-2 text-sm">
                <Calendar className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-muted-foreground">
                  {new Date(salesData.bestDay.date).toLocaleDateString("es-CO")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                ⏰ Hora Pico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{salesData.peakHour}</div>
              <div className="flex items-center mt-2 text-sm">
                <Clock className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-muted-foreground">Mayor actividad</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métodos de pago */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">💳 Métodos de Pago</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribución de ventas por método de pago durante el período
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData.paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"][index],
                      }}
                    />
                    <span className="font-medium text-lg">{method.method}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {method.percentage}%
                    </Badge>
                    <span className="font-bold text-xl text-green-600">{formatCurrency(method.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top meseros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🏆 Mejores Meseros del Período</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ranking de meseros por ventas totales y número de órdenes atendidas
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData.topWaiters.map((waiter, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{waiter.name}</p>
                      <p className="text-sm text-muted-foreground">📋 {waiter.orders} órdenes atendidas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-green-600">{formatCurrency(waiter.sales)}</p>
                    <p className="text-sm text-muted-foreground">
                      💳 {formatCurrency(waiter.sales / waiter.orders)} promedio/orden
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
