/* ══════════════════════════════════════════════════════════
   LIGA PROFESIONAL — módulo de equipos para Truco Argentino
   - Los 20 clubes agrupados en la categoría LIGA PROFESIONAL
     (desplegable, con el logo oficial de la liga)
   - El jugador elige su club en la pantalla de registro
   - El escudo se muestra en la mesa junto al avatar
   - La IA recibe un club rival al azar
   - Las barras de progreso toman el color del club
   No modifica el código existente: solo envuelve setName().
   ══════════════════════════════════════════════════════════ */

const ESCUDOS = {
  boca: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMTAzMDY5Ii8+PHJlY3QgeD0iMCIgeT0iNDgiIHdpZHRoPSIxMDAiIGhlaWdodD0iMjQiIGZpbGw9IiNGOUJCMzEiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0idXJsKCNnbCkiLz48L2c+PHBhdGggZD0iTTUwIDUgTDkxIDE3IFY2MCBROTEgOTQgNTAgMTE1IFE5IDk0IDkgNjAgVjE3IFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIzLjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
  river: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZmZmZmZmIi8+PHBvbHlnb24gcG9pbnRzPSIwLDE4IDIyLDAgMTAwLDg2IDEwMCwxMDggNzgsMTIwIDAsNDAiIGZpbGw9IiNlZDE5MmQiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0idXJsKCNnbCkiLz48L2c+PHBhdGggZD0iTTUwIDUgTDkxIDE3IFY2MCBROTEgOTQgNTAgMTE1IFE5IDk0IDkgNjAgVjE3IFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIzLjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
  racing: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iMTIuNSIgeT0iMCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzc1YzhmMCIvPjxyZWN0IHg9IjYyLjUiIHk9IjAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIxMjAiIGZpbGw9IiM3NWM4ZjAiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0idXJsKCNnbCkiLz48L2c+PHBhdGggZD0iTTUwIDUgTDkxIDE3IFY2MCBROTEgOTQgNTAgMTE1IFE5IDk0IDkgNjAgVjE3IFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIzLjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
  sanloren: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMDAzMzdmIi8+PHJlY3QgeD0iMTIuNSIgeT0iMCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2VhMjAyYyIvPjxyZWN0IHg9IjYyLjUiIHk9IjAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNlYTIwMmMiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0idXJsKCNnbCkiLz48L2c+PHBhdGggZD0iTTUwIDUgTDkxIDE3IFY2MCBROTEgOTQgNTAgMTE1IFE5IDk0IDkgNjAgVjE3IFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIzLjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
  indep: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZTAxNTFkIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9InVybCgjZ2wpIi8+PC9nPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIiBmaWxsPSJub25lIiBzdHJva2U9IiMxYTFhMWEiIHN0cm9rZS13aWR0aD0iMy41IiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+",
  instituto: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZmZmZmZmIi8+PHBvbHlnb24gcG9pbnRzPSIxMDAsMTggNzgsMCAwLDg2IDAsMTA4IDIyLDEyMCAxMDAsNDAiIGZpbGw9IiNERjA0MEIiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0idXJsKCNnbCkiLz48L2c+PHBhdGggZD0iTTUwIDUgTDkxIDE3IFY2MCBROTEgOTQgNTAgMTE1IFE5IDk0IDkgNjAgVjE3IFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIzLjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
  talleres: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMGQxYjNkIi8+PHJlY3QgeD0iMTIuNSIgeT0iMCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjYyLjUiIHk9IjAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNmZmZmZmYiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0idXJsKCNnbCkiLz48L2c+PHBhdGggZD0iTTUwIDUgTDkxIDE3IFY2MCBROTEgOTQgNTAgMTE1IFE5IDk0IDkgNjAgVjE3IFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIzLjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
  belgrano: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMDBhN2UxIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9InVybCgjZ2wpIi8+PC9nPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIiBmaWxsPSJub25lIiBzdHJva2U9IiMxYTFhMWEiIHN0cm9rZS13aWR0aD0iMy41IiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+",
  banfield: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iMTIuNSIgeT0iMCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzE1OWE0YSIvPjxyZWN0IHg9IjYyLjUiIHk9IjAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIxMjAiIGZpbGw9IiMxNTlhNGEiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0idXJsKCNnbCkiLz48L2c+PHBhdGggZD0iTTUwIDUgTDkxIDE3IFY2MCBROTEgOTQgNTAgMTE1IFE5IDk0IDkgNjAgVjE3IFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIzLjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
  atucuman: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iMTIuNSIgeT0iMCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzc5YjZlNCIvPjxyZWN0IHg9IjYyLjUiIHk9IjAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIxMjAiIGZpbGw9IiM3OWI2ZTQiLz48cG9seWdvbiBwb2ludHM9IjUwLjAsMjMuMCA1Mi43LDMwLjMgNjAuNSwzMC42IDU0LjQsMzUuNCA1Ni41LDQyLjkgNTAuMCwzOC42IDQzLjUsNDIuOSA0NS42LDM1LjQgMzkuNSwzMC42IDQ3LjMsMzAuMyIgZmlsbD0iI2MxYTE1ZSIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSJ1cmwoI2dsKSIvPjwvZz48cGF0aCBkPSJNNTAgNSBMOTEgMTcgVjYwIFE5MSA5NCA1MCAxMTUgUTkgOTQgOSA2MCBWMTcgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWExYTFhIiBzdHJva2Utd2lkdGg9IjMuNSIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==",
  argjuniors: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZDgxNjFmIi8+PHBvbHlnb24gcG9pbnRzPSI1MC4wLDI1LjAgNTMuMiwzMy42IDYyLjQsMzQuMCA1NS4yLDM5LjcgNTcuNiw0OC41IDUwLjAsNDMuNSA0Mi40LDQ4LjUgNDQuOCwzOS43IDM3LjYsMzQuMCA0Ni44LDMzLjYiIGZpbGw9IiNmZmZmZmYiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0idXJsKCNnbCkiLz48L2c+PHBhdGggZD0iTTUwIDUgTDkxIDE3IFY2MCBROTEgOTQgNTAgMTE1IFE5IDk0IDkgNjAgVjE3IFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIzLjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
  estudiantes: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZWMxYjIzIi8+PHJlY3QgeD0iMCIgeT0iNDgiIHdpZHRoPSIxMDAiIGhlaWdodD0iMjIiIGZpbGw9IiNmZmZmZmYiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0idXJsKCNnbCkiLz48L2c+PHBhdGggZD0iTTUwIDUgTDkxIDE3IFY2MCBROTEgOTQgNTAgMTE1IFE5IDk0IDkgNjAgVjE3IFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIzLjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
  defensa: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMGU3YTM1Ii8+PHBvbHlnb24gcG9pbnRzPSIwLDE4IDIyLDAgMTAwLDg2IDEwMCwxMDggNzgsMTIwIDAsNDAiIGZpbGw9IiNmN2QxMTciLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0idXJsKCNnbCkiLz48L2c+PHBhdGggZD0iTTUwIDUgTDkxIDE3IFY2MCBROTEgOTQgNTAgMTE1IFE5IDk0IDkgNjAgVjE3IFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIzLjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
  huracan: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZTMwNjEzIi8+PHBhdGggZD0iTTUwIDE2IEw4MCAyNSBWNTggUTgwIDg0IDUwIDEwMSBRMjAgODQgMjAgNTggVjI1IFoiIGZpbGw9IiNmZmZmZmYiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0idXJsKCNnbCkiLz48L2c+PHBhdGggZD0iTTUwIDUgTDkxIDE3IFY2MCBROTEgOTQgNTAgMTE1IFE5IDk0IDkgNjAgVjE3IFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIzLjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
  gimnasia: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iMCIgeT0iNDgiIHdpZHRoPSIxMDAiIGhlaWdodD0iMjIiIGZpbGw9IiMxNTE1NWMiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0idXJsKCNnbCkiLz48L2c+PHBhdGggZD0iTTUwIDUgTDkxIDE3IFY2MCBROTEgOTQgNTAgMTE1IFE5IDk0IDkgNjAgVjE3IFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIzLjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
  newells: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSI1MCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNlMzFiMjMiLz48cmVjdCB4PSI1MCIgeT0iMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzFhMWExYSIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSJ1cmwoI2dsKSIvPjwvZz48cGF0aCBkPSJNNTAgNSBMOTEgMTcgVjYwIFE5MSA5NCA1MCAxMTUgUTkgOTQgOSA2MCBWMTcgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWExYTFhIiBzdHJva2Utd2lkdGg9IjMuNSIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==",
  lanus: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjN2ExZjMzIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9InVybCgjZ2wpIi8+PC9nPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIiBmaWxsPSJub25lIiBzdHJva2U9IiMxYTFhMWEiIHN0cm9rZS13aWR0aD0iMy41IiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+",
  rcental: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSI1MCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiMwYTNkNzIiLz48cmVjdCB4PSI1MCIgeT0iMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2ZjZDkxZiIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSJ1cmwoI2dsKSIvPjwvZz48cGF0aCBkPSJNNTAgNSBMOTEgMTcgVjYwIFE5MSA5NCA1MCAxMTUgUTkgOTQgOSA2MCBWMTcgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWExYTFhIiBzdHJva2Utd2lkdGg9IjMuNSIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==",
  velez: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZmZmZmZmIi8+PHBvbHlnb24gcG9pbnRzPSIxNCwyMiAzMiwyMiA1MCw3MiA2OCwyMiA4NiwyMiA1OCw5OCA0Miw5OCIgZmlsbD0iIzAxNjFhOCIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSJ1cmwoI2dsKSIvPjwvZz48cGF0aCBkPSJNNTAgNSBMOTEgMTcgVjYwIFE5MSA5NCA1MCAxMTUgUTkgOTQgOSA2MCBWMTcgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWExYTFhIiBzdHJva2Utd2lkdGg9IjMuNSIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==",
  platense: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTIwIj48ZGVmcz48Y2xpcFBhdGggaWQ9InMiPjxwYXRoIGQ9Ik01MCA1IEw5MSAxNyBWNjAgUTkxIDk0IDUwIDExNSBROSA5NCA5IDYwIFYxNyBaIi8+PC9jbGlwUGF0aD48bGluZWFyR3JhZGllbnQgaWQ9ImdsIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii4xOCIvPjxzdG9wIG9mZnNldD0iLjM1IiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjcykiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZmZmZmZmIi8+PHBvbHlnb24gcG9pbnRzPSIwLDE4IDIyLDAgMTAwLDg2IDEwMCwxMDggNzgsMTIwIDAsNDAiIGZpbGw9IiM1YzM5MTkiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0idXJsKCNnbCkiLz48L2c+PHBhdGggZD0iTTUwIDUgTDkxIDE3IFY2MCBROTEgOTQgNTAgMTE1IFE5IDk0IDkgNjAgVjE3IFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWExYSIgc3Ryb2tlLXdpZHRoPSIzLjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4="
};

const LIGA_LPA = {
  id: "lpa",
  region: "sudamerica",
  nombre: "LIGA PROFESIONAL",
  badge: "Argentina · 1ª División",
  logo: "escudos/ARGENTINA/argentina-primera-division-footballlogos-org.svg",
  equipos: [
    {id:"boca", nombre:"Boca Juniors", sub:"La Ribera", color:"#F9BB31", escudo:"escudos/ARGENTINA/boca-juniors.svg", fuerza:88},
    {id:"river", nombre:"River Plate", sub:"El Millonario", color:"#ed192d", escudo:"escudos/ARGENTINA/river-plate.svg", fuerza:90},
    {id:"racing", nombre:"Racing Club", sub:"La Academia", color:"#75c8f0", escudo:"escudos/ARGENTINA/racing-club.svg", fuerza:75},
    {id:"sanloren", nombre:"San Lorenzo", sub:"El Ciclón", color:"#ea202c", escudo:"escudos/ARGENTINA/san-lorenzo.svg", fuerza:65},
    {id:"indep", nombre:"Independiente", sub:"El Rojo", color:"#e0151d", escudo:"escudos/ARGENTINA/independiente-footballlogos-org.svg", fuerza:70},
    {id:"instituto", nombre:"Instituto", sub:"La Gloria", color:"#DF040B", escudo:"escudos/ARGENTINA/instituto-cordoba.svg", fuerza:55},
    {id:"talleres", nombre:"Talleres", sub:"La T", color:"#4a90d9", escudo:"escudos/ARGENTINA/talleres.svg", fuerza:72},
    {id:"belgrano", nombre:"Belgrano", sub:"El Pirata", color:"#00a7e1", escudo:"escudos/ARGENTINA/Belgrano.svg", fuerza:60},
    {id:"banfield", nombre:"Banfield", sub:"El Taladro", color:"#159a4a", escudo:"escudos/ARGENTINA/banfield.svg", fuerza:55},
    {id:"atucuman", nombre:"Atlético Tucumán", sub:"El Decano", color:"#79b6e4", escudo:"escudos/ARGENTINA/atletico-tucuman.svg", fuerza:52},
    {id:"argjuniors", nombre:"Argentinos Juniors", sub:"El Bicho", color:"#d8161f", escudo:"escudos/ARGENTINA/argentinos-juniors.svg", fuerza:58},
    {id:"estudiantes", nombre:"Estudiantes LP", sub:"El Pincha", color:"#ec1b23", escudo:"escudos/ARGENTINA/estudiantes-la-plata.svg", fuerza:68},
    {id:"defensa", nombre:"Defensa y Justicia", sub:"El Halcón", color:"#f7d117", escudo:"escudos/ARGENTINA/defensa-y-justicia.svg", fuerza:62},
    {id:"huracan", nombre:"Huracán", sub:"El Globo", color:"#e30613", escudo:"escudos/ARGENTINA/HURACAN.svg", fuerza:58},
    {id:"gimnasia", nombre:"Gimnasia LP", sub:"El Lobo", color:"#15155c", escudo:"escudos/ARGENTINA/gimnasia-y-esgrima-la-plata.svg", fuerza:56},
    {id:"newells", nombre:"Newell's Old Boys", sub:"La Lepra", color:"#e31b23", escudo:"escudos/ARGENTINA/newells-old-boys.svg", fuerza:65},
    {id:"lanus", nombre:"Lanús", sub:"El Granate", color:"#7a1f33", escudo:"escudos/ARGENTINA/lanus.svg", fuerza:60},
    {id:"rcental", nombre:"Rosario Central", sub:"El Canalla", color:"#fcd91f", escudo:"escudos/ARGENTINA/rosario-central.svg", fuerza:64},
    {id:"velez", nombre:"Vélez Sarsfield", sub:"El Fortín", color:"#0161a8", escudo:"escudos/ARGENTINA/velez-sarsfield.svg", fuerza:70},
    {id:"platense", nombre:"Atlético Platense", sub:"El Calamar", color:"#5c3919", escudo:"escudos/ARGENTINA/Platense.svg", fuerza:50}
  ]
};

/* ── LALIGA (España) — escudos oficiales reales en escudos/laliga/*.svg ── */
const LIGA_LALIGA = {
  id: "laliga",
  region: "europa",
  nombre: "LALIGA",
  badge: "España · 1ª División",
  logo: "escudos/laliga/la-liga.svg",
  equipos: [
    {id:"real-madrid",    nombre:"Real Madrid",        sub:"Los Blancos",         color:"#febe10", escudo:"escudos/laliga/real-madrid.svg", fuerza:97},
    {id:"barcelona",      nombre:"FC Barcelona",       sub:"Blaugrana",           color:"#a50044", escudo:"escudos/laliga/barcelona.svg", fuerza:95},
    {id:"atletico-madrid",nombre:"Atlético de Madrid", sub:"Los Colchoneros",     color:"#ce3524", escudo:"escudos/laliga/atletico-madrid.svg", fuerza:88},
    {id:"sevilla",        nombre:"Sevilla FC",         sub:"Los Nervionenses",    color:"#d00027", escudo:"escudos/laliga/sevilla.svg", fuerza:75},
    {id:"valencia",       nombre:"Valencia CF",        sub:"Los Che",             color:"#ee3524", escudo:"escudos/laliga/valencia.svg", fuerza:72},
    {id:"villarreal",     nombre:"Villarreal CF",      sub:"El Submarino Amarillo", color:"#ffe667", escudo:"escudos/laliga/villarreal.svg", fuerza:78},
    {id:"real-betis",     nombre:"Real Betis",         sub:"Los Verdiblancos",    color:"#00954c", escudo:"escudos/laliga/real-betis.svg", fuerza:73},
    {id:"real-sociedad",  nombre:"Real Sociedad",      sub:"La Real",             color:"#0067b1", escudo:"escudos/laliga/real-sociedad.svg", fuerza:74},
    {id:"athletic-club",  nombre:"Athletic Club",      sub:"Los Leones",          color:"#ee2523", escudo:"escudos/laliga/athletic-club.svg", fuerza:76},
    {id:"espanyol",       nombre:"RCD Espanyol",       sub:"Los Pericos",         color:"#0066b3", escudo:"escudos/laliga/espanyol.svg", fuerza:55},
    {id:"celta",          nombre:"Celta de Vigo",      sub:"Os Celestes",         color:"#8accf0", escudo:"escudos/laliga/celta.svg", fuerza:60},
    {id:"deportivo",      nombre:"Deportivo La Coruña",sub:"Los Coruñistas",      color:"#0d3b7e", escudo:"escudos/laliga/deportivo.svg", fuerza:50},
    {id:"elche",          nombre:"Elche CF",           sub:"Los Franjiverdes",    color:"#00944d", escudo:"escudos/laliga/elche.svg", fuerza:48},
    {id:"getafe",         nombre:"Getafe CF",          sub:"El Geta",             color:"#005ca9", escudo:"escudos/laliga/getafe.svg", fuerza:58},
    {id:"oviedo",         nombre:"Real Oviedo",        sub:"Los Carbayones",      color:"#0b4ea2", escudo:"escudos/laliga/oviedo.svg", fuerza:47},
    {id:"osasuna",        nombre:"CA Osasuna",         sub:"Los Rojillos",        color:"#d2122e", escudo:"escudos/laliga/osasuna.svg", fuerza:56},
    {id:"mallorca",       nombre:"RCD Mallorca",       sub:"Los Bermellones",     color:"#ce1126", escudo:"escudos/laliga/mallorca.svg", fuerza:54},
    {id:"levante",        nombre:"Levante UD",         sub:"Los Granotas",        color:"#0e3d7c", escudo:"escudos/laliga/levante.svg", fuerza:49},
    {id:"girona",         nombre:"Girona FC",          sub:"Los Blanquivermells", color:"#cd2534", escudo:"escudos/laliga/girona.svg", fuerza:65},
    {id:"rayo-vallecano", nombre:"Rayo Vallecano",     sub:"Los Franjirrojos",    color:"#e3000f", escudo:"escudos/laliga/rayo-vallecano.svg", fuerza:57}
  ]
};

/* ── BRASILEIRÃO (Brasil) — escudos oficiales reales ── */
const LIGA_BRASIL = {
  id: "brasil",
  region: "sudamerica",
  nombre: "BRASILEIRÃO",
  badge: "Brasil · Série A",
  logo: "escudos/BRASIL/brazil_brazilian-serie-a.football-logos.cc.svg",
  equipos: [
    {id:"athletico-pr",   nombre:"Athletico Paranaense", sub:"Furacão",            color:"#cc092f", escudo:"escudos/BRASIL/brazil_athletico-paranaense.football-logos.cc.svg", fuerza:68},
    {id:"atletico-mg",    nombre:"Atlético Mineiro",     sub:"Galo",               color:"#1a1a1a", escudo:"escudos/BRASIL/brazil_atletico-mineiro.football-logos.cc.svg", fuerza:78},
    {id:"bahia",          nombre:"Bahia",                sub:"Esquadrão de Aço",   color:"#0b3b7a", escudo:"escudos/BRASIL/brazil_bahia.football-logos.cc.svg", fuerza:65},
    {id:"botafogo",       nombre:"Botafogo",             sub:"Fogão",              color:"#1a1a1a", escudo:"escudos/BRASIL/brazil_botafogo.football-logos.cc.svg", fuerza:75},
    {id:"chapecoense",    nombre:"Chapecoense",          sub:"Verdão do Oeste",    color:"#1c8a42", escudo:"escudos/BRASIL/brazil_chapecoense.football-logos.cc.svg", fuerza:50},
    {id:"remo",           nombre:"Clube do Remo",        sub:"Leão Azul",          color:"#0c4ea2", escudo:"escudos/BRASIL/brazil_clube-do-remo.football-logos.cc.svg", fuerza:45},
    {id:"corinthians",    nombre:"Corinthians",          sub:"Timão",              color:"#1a1a1a", escudo:"escudos/BRASIL/brazil_corinthians.football-logos.cc.svg", fuerza:76},
    {id:"coritiba",       nombre:"Coritiba",             sub:"Coxa",               color:"#1c8a42", escudo:"escudos/BRASIL/brazil_coritiba.football-logos.cc.svg", fuerza:52},
    {id:"cruzeiro",       nombre:"Cruzeiro",             sub:"Raposa",             color:"#003399", escudo:"escudos/BRASIL/brazil_cruzeiro.football-logos.cc.svg", fuerza:74},
    {id:"flamengo",       nombre:"Flamengo",             sub:"Mengão",             color:"#e30613", escudo:"escudos/BRASIL/brazil_flamengo.football-logos.cc.svg", fuerza:90},
    {id:"fluminense",     nombre:"Fluminense",           sub:"Tricolor das Laranjeiras", color:"#870619", escudo:"escudos/BRASIL/brazil_fluminense.football-logos.cc.svg", fuerza:73},
    {id:"gremio",         nombre:"Grêmio",               sub:"Imortal Tricolor",   color:"#0d3b7e", escudo:"escudos/BRASIL/brazil_gremio.football-logos.cc.svg", fuerza:77},
    {id:"internacional",  nombre:"Internacional",        sub:"Colorado",           color:"#e30613", escudo:"escudos/BRASIL/brazil_internacional.football-logos.cc.svg", fuerza:76},
    {id:"mirassol",       nombre:"Mirassol",             sub:"Leão",               color:"#fdb913", escudo:"escudos/BRASIL/brazil_mirassol.football-logos.cc.svg", fuerza:55},
    {id:"palmeiras",      nombre:"Palmeiras",            sub:"Verdão",             color:"#006437", escudo:"escudos/BRASIL/brazil_palmeiras.football-logos.cc.svg", fuerza:88},
    {id:"bragantino",     nombre:"RB Bragantino",        sub:"Massa Bruta",        color:"#e30613", escudo:"escudos/BRASIL/brazil_rb-bragantino.football-logos.cc.svg", fuerza:68},
    {id:"santos",         nombre:"Santos",               sub:"Peixe",              color:"#1a1a1a", escudo:"escudos/BRASIL/brazil_santos.football-logos.cc.svg", fuerza:72},
    {id:"sao-paulo",      nombre:"São Paulo",            sub:"Tricolor Paulista",  color:"#c1272d", escudo:"escudos/BRASIL/brazil_sao-paulo.football-logos.cc.svg", fuerza:79},
    {id:"vasco",          nombre:"Vasco da Gama",        sub:"Gigante da Colina",  color:"#1a1a1a", escudo:"escudos/BRASIL/brazil_vasco-da-gama.football-logos.cc.svg", fuerza:67},
    {id:"vitoria",        nombre:"Vitória",              sub:"Leão da Barra",      color:"#e30613", escudo:"escudos/BRASIL/brazil_vitoria.football-logos.cc.svg", fuerza:53}
  ]
};

/* ── LIGA DE COLOMBIA — Categoría Primera A ── */
const LIGA_COLOMBIA = {
  id: "colombia",
  region: "sudamerica",
  nombre: "LIGA COLOMBIANA",
  badge: "Colombia · Categoría Primera A",
  logo: "escudos/LIGA DE COLOMBIA/colombia_categoria-primera-a.football-logos.cc.svg",
  equipos: [
    {id:"aguilas-doradas",      nombre:"Águilas Doradas",        sub:"Las Águilas",        color:"#f5c518", escudo:"escudos/LIGA DE COLOMBIA/colombia_aguilas-doradas.football-logos.cc.svg", fuerza:55},
    {id:"alianza-valledupar",   nombre:"Alianza Valledupar",     sub:"Alianza FC",         color:"#1c5fa8", escudo:"escudos/LIGA DE COLOMBIA/colombia_alianza-valledupar.football-logos.cc.svg", fuerza:45},
    {id:"america-cali",         nombre:"América de Cali",        sub:"Diablos Rojos",      color:"#d2122e", escudo:"escudos/LIGA DE COLOMBIA/colombia_america-de-cali.football-logos.cc.svg", fuerza:70},
    {id:"junior",                nombre:"Atlético Junior",        sub:"Tiburón",            color:"#b8202e", escudo:"escudos/LIGA DE COLOMBIA/colombia_atletico-junior.football-logos.cc.svg", fuerza:68},
    {id:"nacional",              nombre:"Atlético Nacional",      sub:"Verdolaga",          color:"#1c8a42", escudo:"escudos/LIGA DE COLOMBIA/colombia_atletico-nacional.football-logos.cc.svg", fuerza:75},
    {id:"boyaca-chico",          nombre:"Boyacá Chicó",           sub:"Ajedrezado",         color:"#1a1a1a", escudo:"escudos/LIGA DE COLOMBIA/colombia_boyaca-chico.football-logos.cc.svg", fuerza:48},
    {id:"bucaramanga",           nombre:"Atlético Bucaramanga",   sub:"Leopardo",           color:"#c89b3c", escudo:"escudos/LIGA DE COLOMBIA/colombia_bucaramanga.football-logos.cc.svg", fuerza:60},
    {id:"cucuta",                nombre:"Cúcuta Deportivo",       sub:"El Cúcuta",          color:"#d2122e", escudo:"escudos/LIGA DE COLOMBIA/colombia_cucuta-deportivo.football-logos.cc.svg", fuerza:42},
    {id:"tolima",                nombre:"Deportes Tolima",        sub:"El Vinotinto",       color:"#870619", escudo:"escudos/LIGA DE COLOMBIA/colombia_deportes-tolima.football-logos.cc.svg", fuerza:62},
    {id:"dep-cali",              nombre:"Deportivo Cali",         sub:"Los Azucareros",     color:"#1c8a42", escudo:"escudos/LIGA DE COLOMBIA/colombia_deportivo-cali.football-logos.cc.svg", fuerza:65},
    {id:"pasto",                 nombre:"Deportivo Pasto",        sub:"Los Volcánicos",     color:"#d2122e", escudo:"escudos/LIGA DE COLOMBIA/colombia_deportivo-pasto.football-logos.cc.svg", fuerza:50},
    {id:"pereira",               nombre:"Deportivo Pereira",      sub:"Los Matecañas",      color:"#f5c518", escudo:"escudos/LIGA DE COLOMBIA/colombia_deportivo-pereira.football-logos.cc.svg", fuerza:56},
    {id:"medellin",              nombre:"Independiente Medellín", sub:"El Poderoso",        color:"#d2122e", escudo:"escudos/LIGA DE COLOMBIA/colombia_independiente-medellin.football-logos.cc.svg", fuerza:64},
    {id:"santa-fe",              nombre:"Independiente Santa Fe", sub:"El Cardenal",        color:"#b8202e", escudo:"escudos/LIGA DE COLOMBIA/colombia_independiente-santa-fe.football-logos.cc.svg", fuerza:66},
    {id:"internacional-bogota",  nombre:"Internacional FC",       sub:"El Inter de Bogotá", color:"#1c5fa8", escudo:"escudos/LIGA DE COLOMBIA/colombia_internacional-de-bogota.football-logos.cc.svg", fuerza:40},
    {id:"llaneros",               nombre:"Llaneros FC",            sub:"Los Llaneros",       color:"#1c8a42", escudo:"escudos/LIGA DE COLOMBIA/colombia_llaneros.football-logos.cc.svg", fuerza:38},
    {id:"millonarios",            nombre:"Millonarios",            sub:"El Embajador",       color:"#003399", escudo:"escudos/LIGA DE COLOMBIA/colombia_millonarios.football-logos.cc.svg", fuerza:73}
  ]
};

/* ── LIGA DE ECUADOR — LigaPro Serie A ── */
const LIGA_ECUADOR = {
  id: "ecuador",
  region: "sudamerica",
  nombre: "LIGAPRO ECUADOR",
  badge: "Ecuador · Serie A",
  logo: "escudos/LIGA DE ECUADOR/ecuador_liga-pro-serie-a.football-logos.cc.svg",
  equipos: [
    {id:"aucas",            nombre:"Aucas",                    sub:"El Papá del Ecuador", color:"#f5c518", escudo:"escudos/LIGA DE ECUADOR/ecuador_aucas.football-logos.cc.svg", fuerza:58},
    {id:"barcelona-sc",     nombre:"Barcelona SC",             sub:"El Ídolo",            color:"#f5c518", escudo:"escudos/LIGA DE ECUADOR/ecuador_barcelona-sc.football-logos.cc.svg", fuerza:72},
    {id:"delfin",           nombre:"Delfín SC",                sub:"El Cetáceo",          color:"#003399", escudo:"escudos/LIGA DE ECUADOR/ecuador_delfin.football-logos.cc.svg", fuerza:55},
    {id:"dep-cuenca",       nombre:"Deportivo Cuenca",         sub:"Los Morlacos",        color:"#870619", escudo:"escudos/LIGA DE ECUADOR/ecuador_deportivo-cuenca.football-logos.cc.svg", fuerza:50},
    {id:"el-nacional",      nombre:"El Nacional",              sub:"El Ejército",         color:"#1a1a1a", escudo:"escudos/LIGA DE ECUADOR/ecuador_el-nacional.football-logos.cc.svg", fuerza:52},
    {id:"emelec",           nombre:"Emelec",                   sub:"El Bombillo",         color:"#003399", escudo:"escudos/LIGA DE ECUADOR/ecuador_emelec.football-logos.cc.svg", fuerza:68},
    {id:"idv",              nombre:"Independiente del Valle",  sub:"El Rey de Copas",     color:"#003399", escudo:"escudos/LIGA DE ECUADOR/ecuador_independiente-del-valle.football-logos.cc.svg", fuerza:74},
    {id:"libertad-loja",    nombre:"Libertad FC",              sub:"El Cacique",          color:"#1a1a1a", escudo:"escudos/LIGA DE ECUADOR/ecuador_libertad.football-logos.cc.svg", fuerza:45},
    {id:"ldu",              nombre:"LDU de Quito",             sub:"La U",                color:"#f5c518", escudo:"escudos/LIGA DE ECUADOR/ecuador_liga-de-quito.football-logos.cc.svg", fuerza:73},
    {id:"macara",           nombre:"Macará",                   sub:"El Ambateño",         color:"#fdb913", escudo:"escudos/LIGA DE ECUADOR/ecuador_macara.football-logos.cc.svg", fuerza:48},
    {id:"manta",            nombre:"Manta FC",                 sub:"Los Toreros",         color:"#d2122e", escudo:"escudos/LIGA DE ECUADOR/ecuador_manta-fc.football-logos.cc.svg", fuerza:42},
    {id:"mushuc-runa",      nombre:"Mushuc Runa",              sub:"La Banda Roja",       color:"#c1272d", escudo:"escudos/LIGA DE ECUADOR/ecuador_mushuc-runa.football-logos.cc.svg", fuerza:50},
    {id:"orense",           nombre:"Orense SC",                sub:"La Naranja Mecánica", color:"#f5821f", escudo:"escudos/LIGA DE ECUADOR/ecuador_orense.football-logos.cc.svg", fuerza:47},
    {id:"tecnico-u",        nombre:"Técnico Universitario",    sub:"Los Universitarios",  color:"#1c8a42", escudo:"escudos/LIGA DE ECUADOR/ecuador_tecnico-universitario.football-logos.cc.svg", fuerza:44},
    {id:"u-catolica",       nombre:"Universidad Católica",     sub:"La Católica",         color:"#003399", escudo:"escudos/LIGA DE ECUADOR/ecuador_universidad-catolica-quito.football-logos.cc.svg", fuerza:58}
  ]
};

/* ── LIGA DE VENEZUELA — Liga FUTVE ── */
const LIGA_VENEZUELA = {
  id: "venezuela",
  region: "sudamerica",
  nombre: "LIGA FUTVE",
  badge: "Venezuela · Liga FUTVE",
  logo: "escudos/LIGA DE VENEZUELA/venezuela_primera-division-de-venezuela.football-logos.cc.svg",
  equipos: [
    {id:"anzoategui",      nombre:"Academia Anzoátegui",      sub:"Rojinegro",                color:"#d2122e", escudo:"escudos/LIGA DE VENEZUELA/venezuela_academia-anzoategui.football-logos.cc.svg", fuerza:45},
    {id:"puerto-cabello",  nombre:"Academia Puerto Cabello",  sub:"El Tiburón",                color:"#003399", escudo:"escudos/LIGA DE VENEZUELA/venezuela_academia-puerto-cabello.football-logos.cc.svg", fuerza:42},
    {id:"carabobo",        nombre:"Carabobo FC",              sub:"El Granate",                color:"#870619", escudo:"escudos/LIGA DE VENEZUELA/venezuela_carabobo.football-logos.cc.svg", fuerza:50},
    {id:"caracas",         nombre:"Caracas FC",               sub:"El Rojo del Ávila",         color:"#d2122e", escudo:"escudos/LIGA DE VENEZUELA/venezuela_caracas.football-logos.cc.svg", fuerza:62},
    {id:"la-guaira",       nombre:"Deportivo La Guaira",      sub:"Tiburones",                 color:"#1a1a1a", escudo:"escudos/LIGA DE VENEZUELA/venezuela_deportivo-la-guaira.football-logos.cc.svg", fuerza:48},
    {id:"tachira",         nombre:"Deportivo Táchira",        sub:"El Aurinegro",              color:"#f5c518", escudo:"escudos/LIGA DE VENEZUELA/venezuela_deportivo-tachira.football-logos.cc.svg", fuerza:60},
    {id:"merida",          nombre:"Estudiantes de Mérida",    sub:"Los Discípulos",            color:"#1c8a42", escudo:"escudos/LIGA DE VENEZUELA/venezuela_estudiantes-merida.football-logos.cc.svg", fuerza:44},
    {id:"metropolitanos",  nombre:"Metropolitanos FC",        sub:"El Metro",                  color:"#6a1b9a", escudo:"escudos/LIGA DE VENEZUELA/venezuela_metropolitanos.football-logos.cc.svg", fuerza:52},
    {id:"monagas",         nombre:"Monagas SC",               sub:"El Galáctico de Oriente",   color:"#f5821f", escudo:"escudos/LIGA DE VENEZUELA/venezuela_monagas.football-logos.cc.svg", fuerza:50},
    {id:"portuguesa",      nombre:"Portuguesa FC",            sub:"El Tractor",                color:"#1c8a42", escudo:"escudos/LIGA DE VENEZUELA/venezuela_portuguesa.football-logos.cc.svg", fuerza:46},
    {id:"rayo-zuliano",    nombre:"Rayo Zuliano",             sub:"El Rayo",                   color:"#f5c518", escudo:"escudos/LIGA DE VENEZUELA/venezuela_rayo-zuliano.football-logos.cc.svg", fuerza:40},
    {id:"ucv",             nombre:"Universidad Central",      sub:"El Galáctico Estudiantil",  color:"#003399", escudo:"escudos/LIGA DE VENEZUELA/venezuela_universidad-central.football-logos.cc.svg", fuerza:38},
    {id:"yaracuyanos",     nombre:"Yaracuyanos FC",           sub:"El Aurinegro Yaracuyano",   color:"#f5c518", escudo:"escudos/LIGA DE VENEZUELA/venezuela_yaracuyanos.football-logos.cc.svg", fuerza:42},
    {id:"zamora",          nombre:"Zamora FC",                sub:"El Ciclón Llanero",         color:"#b8202e", escudo:"escudos/LIGA DE VENEZUELA/venezuela_zamora.football-logos.cc.svg", fuerza:54}
  ]
};

/* ── PREMIER LEAGUE (Inglaterra) ── */
const LIGA_PREMIER = {
  id: "premier",
  region: "europa",
  nombre: "PREMIER LEAGUE",
  badge: "Inglaterra · Premier League",
  logo: "escudos/PREMIER/england_english-premier-league.football-logos.cc.svg",
  equipos: [
    {id:"arsenal",         nombre:"Arsenal",            sub:"The Gunners",   color:"#ef0107", escudo:"escudos/PREMIER/england_arsenal.football-logos.cc.svg", fuerza:92},
    {id:"aston-villa",     nombre:"Aston Villa",        sub:"The Villans",   color:"#95bfe5", escudo:"escudos/PREMIER/england_aston-villa.football-logos.cc.svg", fuerza:78},
    {id:"bournemouth",     nombre:"Bournemouth",        sub:"The Cherries",  color:"#da291c", escudo:"escudos/PREMIER/england_bournemouth.football-logos.cc.svg", fuerza:65},
    {id:"brentford",       nombre:"Brentford",          sub:"The Bees",      color:"#e30613", escudo:"escudos/PREMIER/england_brentford.football-logos.cc.svg", fuerza:62},
    {id:"brighton",        nombre:"Brighton",           sub:"The Seagulls",  color:"#0057b8", escudo:"escudos/PREMIER/england_brighton.football-logos.cc.svg", fuerza:70},
    {id:"chelsea",         nombre:"Chelsea",            sub:"The Blues",     color:"#034694", escudo:"escudos/PREMIER/england_chelsea.football-logos.cc.svg", fuerza:85},
    {id:"coventry",        nombre:"Coventry City",      sub:"The Sky Blues", color:"#78bfe5", escudo:"escudos/PREMIER/england_coventry-city.football-logos.cc.svg", fuerza:55},
    {id:"crystal-palace",  nombre:"Crystal Palace",     sub:"The Eagles",    color:"#1b458f", escudo:"escudos/PREMIER/england_crystal-palace.football-logos.cc.svg", fuerza:68},
    {id:"everton",         nombre:"Everton",            sub:"The Toffees",   color:"#003399", escudo:"escudos/PREMIER/england_everton.football-logos.cc.svg", fuerza:64},
    {id:"fulham",          nombre:"Fulham",             sub:"The Cottagers", color:"#1a1a1a", escudo:"escudos/PREMIER/england_fulham.football-logos.cc.svg", fuerza:63},
    {id:"hull",            nombre:"Hull City",          sub:"The Tigers",    color:"#f18a00", escudo:"escudos/PREMIER/england_hull-city.football-logos.cc.svg", fuerza:50},
    {id:"ipswich",         nombre:"Ipswich Town",       sub:"The Tractor Boys", color:"#0044a9", escudo:"escudos/PREMIER/england_ipswich.football-logos.cc.svg", fuerza:48},
    {id:"leeds",           nombre:"Leeds United",       sub:"The Whites",    color:"#ffcd00", escudo:"escudos/PREMIER/england_leeds-united.football-logos.cc.svg", fuerza:58},
    {id:"liverpool",       nombre:"Liverpool",          sub:"The Reds",      color:"#c8102e", escudo:"escudos/PREMIER/england_liverpool.football-logos.cc.svg", fuerza:95},
    {id:"man-city",        nombre:"Manchester City",    sub:"The Citizens",  color:"#6cabdd", escudo:"escudos/PREMIER/england_manchester-city.football-logos.cc.svg", fuerza:96},
    {id:"man-united",      nombre:"Manchester United",  sub:"The Red Devils", color:"#da291c", escudo:"escudos/PREMIER/england_manchester-united.football-logos.cc.svg", fuerza:86},
    {id:"newcastle",       nombre:"Newcastle United",   sub:"The Magpies",   color:"#1a1a1a", escudo:"escudos/PREMIER/england_newcastle.football-logos.cc.svg", fuerza:80},
    {id:"nottm-forest",    nombre:"Nottingham Forest",  sub:"Tricky Trees",  color:"#dd0000", escudo:"escudos/PREMIER/england_nottingham-forest.football-logos.cc.svg", fuerza:67},
    {id:"sunderland",      nombre:"Sunderland",         sub:"The Black Cats", color:"#eb172b", escudo:"escudos/PREMIER/england_sunderland.football-logos.cc.svg", fuerza:52},
    {id:"tottenham",       nombre:"Tottenham Hotspur",  sub:"Spurs",         color:"#132257", escudo:"escudos/PREMIER/england_tottenham.football-logos.cc.svg", fuerza:82}
  ]
};

/* ── SELECCIONES SUDAMÉRICA — equipos nacionales (CONMEBOL) ── */
const LIGA_SELECCIONES = {
  id: "selecciones",
  region: "selecciones",
  nombre: "SELECCIONES SUDAMÉRICA",
  badge: "CONMEBOL · Selecciones",
  logo: "escudos/SELECCIONES/argentina_argentina-national-team.football-logos.cc.svg",
  equipos: [
    {id:"sel-argentina", nombre:"Argentina", sub:"La Albiceleste", color:"#75aadb", escudo:"escudos/SELECCIONES/argentina_argentina-national-team.football-logos.cc.svg", fuerza:98},
    {id:"sel-bolivia",   nombre:"Bolivia",   sub:"La Verde",       color:"#007a33", escudo:"escudos/SELECCIONES/bolivia_bolivia-national-team.football-logos.cc.svg", fuerza:48},
    {id:"sel-brasil",    nombre:"Brasil",    sub:"A Canarinha",    color:"#fedd00", escudo:"escudos/SELECCIONES/brazil_brazil-national-team.football-logos.cc.svg", fuerza:88},
    {id:"sel-chile",     nombre:"Chile",     sub:"La Roja",        color:"#d2122e", escudo:"escudos/SELECCIONES/chile_chile-national-team.football-logos.cc.svg", fuerza:58},
    {id:"sel-colombia",  nombre:"Colombia",  sub:"La Tricolor",    color:"#fcd116", escudo:"escudos/SELECCIONES/colombia_colombia-national-team.football-logos.cc.svg", fuerza:78},
    {id:"sel-ecuador",   nombre:"Ecuador",   sub:"La Tri",         color:"#fedd00", escudo:"escudos/SELECCIONES/ecuador_ecuador-national-team.football-logos.cc.svg", fuerza:74},
    {id:"sel-guyana",    nombre:"Guyana",    sub:"Golden Jaguars", color:"#009e49", escudo:"escudos/SELECCIONES/guyana_guyana-national-team.football-logos.cc.svg", fuerza:32},
    {id:"sel-paraguay",  nombre:"Paraguay",  sub:"La Albirroja",   color:"#d52b1e", escudo:"escudos/SELECCIONES/paraguay_paraguay-national-team.football-logos.cc.svg", fuerza:65},
    {id:"sel-peru",      nombre:"Perú",      sub:"La Blanquirroja", color:"#d91023", escudo:"escudos/SELECCIONES/peru_peru-national-team.football-logos.cc.svg", fuerza:60},
    {id:"sel-surinam",   nombre:"Surinam",   sub:"Natio",          color:"#009e49", escudo:"escudos/SELECCIONES/suriname_suriname-national-team.football-logos.cc.svg", fuerza:38},
    {id:"sel-uruguay",   nombre:"Uruguay",   sub:"La Celeste",     color:"#75aadb", escudo:"escudos/SELECCIONES/uruguay_uruguay-national-team.football-logos.cc.svg", fuerza:80},
    {id:"sel-venezuela", nombre:"Venezuela", sub:"La Vinotinto",   color:"#870619", escudo:"escudos/SELECCIONES/venezuela_venezuela-national-team.football-logos.cc.svg", fuerza:68}
  ]
};

/* ── MUNDIAL 2026 — los 48 clasificados a la Copa del Mundo ──
   Fuente: clasificación oficial FIFA (incluye repechaje UEFA e
   intercontinental, cerrado en marzo de 2026). Los 6 sudamericanos
   reutilizan el escudo de LIGA_SELECCIONES; el resto vive en su propia
   carpeta escudos/SELECCIONES/. */
const LIGA_MUNDIAL2026 = {
  id: "mundial2026",
  region: "mundial2026",
  nombre: "MUNDIAL 2026",
  badge: "FIFA World Cup 2026",
  logo: "escudos/SELECCIONES/argentina_argentina-national-team.football-logos.cc.svg",
  equipos: [
    // CONMEBOL (6) — mismos escudos que LIGA_SELECCIONES
    {id:"wc-argentina",  nombre:"Argentina",  sub:"La Albiceleste",     color:"#75aadb", escudo:"escudos/SELECCIONES/argentina_argentina-national-team.football-logos.cc.svg", fuerza:98},
    {id:"wc-brasil",     nombre:"Brasil",     sub:"A Canarinha",        color:"#fedd00", escudo:"escudos/SELECCIONES/brazil_brazil-national-team.football-logos.cc.svg", fuerza:88},
    {id:"wc-colombia",   nombre:"Colombia",   sub:"La Tricolor",        color:"#fcd116", escudo:"escudos/SELECCIONES/colombia_colombia-national-team.football-logos.cc.svg", fuerza:78},
    {id:"wc-ecuador",    nombre:"Ecuador",    sub:"La Tri",             color:"#fedd00", escudo:"escudos/SELECCIONES/ecuador_ecuador-national-team.football-logos.cc.svg", fuerza:74},
    {id:"wc-paraguay",   nombre:"Paraguay",   sub:"La Albirroja",       color:"#d52b1e", escudo:"escudos/SELECCIONES/paraguay_paraguay-national-team.football-logos.cc.svg", fuerza:65},
    {id:"wc-uruguay",    nombre:"Uruguay",    sub:"La Celeste",         color:"#75aadb", escudo:"escudos/SELECCIONES/uruguay_uruguay-national-team.football-logos.cc.svg", fuerza:80},
    // UEFA (16)
    {id:"wc-alemania",   nombre:"Alemania",   sub:"Die Mannschaft",     color:"#000000", escudo:"escudos/SELECCIONES/germany_germany-national-team.football-logos.cc.svg", fuerza:86},
    {id:"wc-austria",    nombre:"Austria",    sub:"Das Team",           color:"#ed2939", escudo:"escudos/SELECCIONES/austria_austria-national-team.football-logos.cc.svg", fuerza:74},
    {id:"wc-belgica",    nombre:"Bélgica",    sub:"Diablos Rojos",      color:"#ed2939", escudo:"escudos/SELECCIONES/belgium_belgium-national-team.football-logos.cc.svg", fuerza:82},
    {id:"wc-bosnia",     nombre:"Bosnia y Herzegovina", sub:"Dragones", color:"#002395", escudo:"escudos/SELECCIONES/bosnia-and-herzegovina_bosnia-and-herzegovina-national-team.football-logos.cc.svg", fuerza:64},
    {id:"wc-croacia",    nombre:"Croacia",    sub:"Vatreni",            color:"#ff0000", escudo:"escudos/SELECCIONES/croatia_croatia-national-team.football-logos.cc.svg", fuerza:80},
    {id:"wc-espana",     nombre:"España",     sub:"La Roja",            color:"#c60b1e", escudo:"escudos/SELECCIONES/spain_spain-national-team.football-logos.cc.svg", fuerza:94},
    {id:"wc-escocia",    nombre:"Escocia",    sub:"Tartan Army",        color:"#0065bd", escudo:"escudos/SELECCIONES/scotland_scotland-national-team.football-logos.cc.svg", fuerza:70},
    {id:"wc-francia",    nombre:"Francia",    sub:"Les Bleus",          color:"#0055a4", escudo:"escudos/SELECCIONES/france_france-national-team.football-logos.cc.svg", fuerza:95},
    {id:"wc-paisesbajos",nombre:"Países Bajos", sub:"Naranja Mecánica", color:"#ff6600", escudo:"escudos/SELECCIONES/netherlands_dutch-national-team.football-logos.cc.svg", fuerza:85},
    {id:"wc-noruega",    nombre:"Noruega",    sub:"Løvene",             color:"#ba0c2f", escudo:"escudos/SELECCIONES/norway_norway-national-team.football-logos.cc.svg", fuerza:75},
    {id:"wc-portugal",   nombre:"Portugal",   sub:"Seleção das Quinas", color:"#ff0000", escudo:"escudos/SELECCIONES/portugal_portuguese-football-federation.football-logos.cc.svg", fuerza:88},
    {id:"wc-checa",      nombre:"República Checa", sub:"Los Checos",    color:"#d7141a", escudo:"escudos/SELECCIONES/czech-republic_czech-republic-national-team.football-logos.cc.svg", fuerza:67},
    {id:"wc-suecia",     nombre:"Suecia",     sub:"Blågult",            color:"#006aa7", escudo:"escudos/SELECCIONES/sweden_sweden-national-team.football-logos.cc.svg", fuerza:68},
    {id:"wc-suiza",      nombre:"Suiza",      sub:"La Nati",            color:"#ff0000", escudo:"escudos/SELECCIONES/switzerland_switzerland-national-team.football-logos.cc.svg", fuerza:75},
    {id:"wc-turquia",    nombre:"Turquía",    sub:"Ay-Yıldızlılar",     color:"#e30a17", escudo:"escudos/SELECCIONES/turkey_turkey-national-team.football-logos.cc.svg", fuerza:72},
    {id:"wc-inglaterra", nombre:"Inglaterra", sub:"Three Lions",        color:"#cf081f", escudo:"escudos/SELECCIONES/england_england-national-team.football-logos.cc.svg", fuerza:90},
    // CAF (10)
    {id:"wc-argelia",    nombre:"Argelia",    sub:"Les Fennecs",        color:"#006233", escudo:"escudos/SELECCIONES/algeria_algeria-national-team.football-logos.cc.svg", fuerza:73},
    {id:"wc-caboverde",  nombre:"Cabo Verde", sub:"Tubarões Azuis",     color:"#003893", escudo:"escudos/SELECCIONES/cabo-verde_cabo-verde-national-team.football-logos.cc.svg", fuerza:60},
    {id:"wc-costamarfil",nombre:"Costa de Marfil", sub:"Los Elefantes", color:"#ff8200", escudo:"escudos/SELECCIONES/cote-d-ivoire_cote-d-ivoire-national-team.football-logos.cc.svg", fuerza:75},
    {id:"wc-egipto",     nombre:"Egipto",     sub:"Los Faraones",       color:"#c8102e", escudo:"escudos/SELECCIONES/egypt_egypt-national-team.football-logos.cc.svg", fuerza:74},
    {id:"wc-ghana",      nombre:"Ghana",      sub:"Estrellas Negras",   color:"#006b3f", escudo:"escudos/SELECCIONES/ghana_ghana-national-team.football-logos.cc.svg", fuerza:67},
    {id:"wc-marruecos",  nombre:"Marruecos",  sub:"Los Leones del Atlas", color:"#c1272d", escudo:"escudos/SELECCIONES/morocco_morocco-national-team.football-logos.cc.svg", fuerza:82},
    {id:"wc-rdcongo",    nombre:"RD del Congo", sub:"Los Leopardos",    color:"#007fff", escudo:"escudos/SELECCIONES/congo-dr_congo-dr-national-team.football-logos.cc.svg", fuerza:58},
    {id:"wc-senegal",    nombre:"Senegal",    sub:"Los Leones de la Teranga", color:"#00853f", escudo:"escudos/SELECCIONES/senegal_senegal-national-team.football-logos.cc.svg", fuerza:78},
    {id:"wc-sudafrica",  nombre:"Sudáfrica",  sub:"Bafana Bafana",      color:"#007a4d", escudo:"escudos/SELECCIONES/south-africa_south-africa-national-team.football-logos.cc.svg", fuerza:62},
    {id:"wc-tunez",      nombre:"Túnez",      sub:"Las Águilas de Cartago", color:"#e70013", escudo:"escudos/SELECCIONES/tunisia_tunisia-national-team.football-logos.cc.svg", fuerza:68},
    // AFC (9)
    {id:"wc-arabiasaudita", nombre:"Arabia Saudita", sub:"Los Halcones Verdes", color:"#006c35", escudo:"escudos/SELECCIONES/saudi-arabia_saudi-arabia-national-team.football-logos.cc.svg", fuerza:68},
    {id:"wc-australia",  nombre:"Australia",  sub:"Socceroos",          color:"#00843d", escudo:"escudos/SELECCIONES/australia_australia-national-team.football-logos.cc.svg", fuerza:70},
    {id:"wc-catar",      nombre:"Catar",      sub:"Los Annabi",         color:"#8d1b3d", escudo:"escudos/SELECCIONES/qatar_qatar-national-team.football-logos.cc.svg", fuerza:62},
    {id:"wc-coreadelsur",nombre:"Corea del Sur", sub:"Guerreros Taeguk", color:"#c60c30", escudo:"escudos/SELECCIONES/south-korea_south-korea-national-team.football-logos.cc.svg", fuerza:78},
    {id:"wc-irak",       nombre:"Irak",       sub:"Los Leones de Mesopotamia", color:"#ce1126", escudo:"escudos/SELECCIONES/iraq_iraq-national-team.football-logos.cc.svg", fuerza:56},
    {id:"wc-iran",       nombre:"Irán",       sub:"Team Melli",         color:"#239f40", escudo:"escudos/SELECCIONES/iran_iran-national-team.football-logos.cc.svg", fuerza:72},
    {id:"wc-japon",      nombre:"Japón",      sub:"Samurai Blue",       color:"#0033a0", escudo:"escudos/SELECCIONES/japan_japan-national-team.football-logos.cc.svg", fuerza:80},
    {id:"wc-jordania",   nombre:"Jordania",   sub:"Las Águilas de Nashama", color:"#ce1126", escudo:"escudos/SELECCIONES/jordan_jordan-national-team.football-logos.cc.svg", fuerza:58},
    {id:"wc-uzbekistan", nombre:"Uzbekistán", sub:"Los Lobos Blancos",  color:"#0099b5", escudo:"escudos/SELECCIONES/uzbekistan_uzbekistan-national-team.football-logos.cc.svg", fuerza:60},
    // CONCACAF (6)
    {id:"wc-canada",     nombre:"Canadá",     sub:"Les Rouges",         color:"#ff0000", escudo:"escudos/SELECCIONES/canada_canada-national-team.football-logos.cc.svg", fuerza:72},
    {id:"wc-curazao",    nombre:"Curazao",    sub:"Curazao",            color:"#002b7f", escudo:"escudos/SELECCIONES/curacao_curacao-national-team.football-logos.cc.svg", fuerza:50},
    {id:"wc-eeuu",       nombre:"Estados Unidos", sub:"Stars and Stripes", color:"#b22234", escudo:"escudos/SELECCIONES/usa_usa-national-team.football-logos.cc.svg", fuerza:76},
    {id:"wc-haiti",      nombre:"Haití",      sub:"Les Grenadiers",     color:"#00209f", escudo:"escudos/SELECCIONES/haiti_haiti-national-team.football-logos.cc.svg", fuerza:48},
    {id:"wc-mexico",     nombre:"México",     sub:"El Tri",             color:"#006847", escudo:"escudos/SELECCIONES/mexico_mexico-national-team.football-logos.cc.svg", fuerza:75},
    {id:"wc-panama",     nombre:"Panamá",     sub:"Los Canaleros",      color:"#da121a", escudo:"escudos/SELECCIONES/panama_panama-national-team.football-logos.cc.svg", fuerza:62},
    // OFC (1)
    {id:"wc-nuevazelanda", nombre:"Nueva Zelanda", sub:"All Whites",    color:"#000000", escudo:"escudos/SELECCIONES/new-zealand_new-zealand-national-team.football-logos.cc.svg", fuerza:52}
  ]
};

/* Todas las ligas disponibles. LIGA = la liga activa (cambia según el club elegido) */
// Ligas seleccionables/visibles en los selectores (registro, amistoso, etc.).
// Brasil, Colombia, Ecuador y Venezuela ya NO aparecen como ligas: sus
// clubes solo salen para la Copa Libertadores.
const LIGAS = [LIGA_LPA, LIGA_LALIGA, LIGA_PREMIER, LIGA_SELECCIONES, LIGA_MUNDIAL2026];
// Ligas que existen SOLO para nutrir la Libertadores (no se muestran como liga).
const LIGAS_LIBERTADORES = [LIGA_BRASIL, LIGA_COLOMBIA, LIGA_ECUADOR, LIGA_VENEZUELA];
let LIGA = LIGA_LPA;

/* Agrupación regional del selector: clubes de Sudamérica, clubes de Europa, selecciones */
const REGIONES = [
  { key: "sudamerica", nombre: "CLUBES — SUDAMÉRICA" },
  { key: "europa", nombre: "CLUBES — EUROPA" },
  { key: "selecciones", nombre: "SELECCIONES NACIONALES" },
  { key: "mundial2026", nombre: "MUNDIAL 2026" }
];

/* ── Helpers multi-liga ── */
// Antes había una lista de escudos cuyo SVG el rasterizador no podía
// convertir (quedaba un WebP en blanco) y para esos se servía el SVG
// original. Se corrió optimizar_escudos.sh con magick (renderer) + cwebp
// (encoder) sobre todos los SVG pendientes y los 8 de esa lista ya tienen
// WebP válido — se retiró el Set. Los que falten por cualquier otro motivo
// caen al fallback onerror -> .svg.
function escudoDe(eq) {
  if (!eq) return "";
  const p = eq.escudo || ESCUDOS[eq.id] || "";
  return p.replace(/\.svg$/i, ".webp");
}
// Fallback en cadena para que NUNCA quede un "ícono roto":
//   1º falla el .webp  → reintenta con el .svg original
//   2º falla el .svg   → muestra un placeholder generado (disco con iniciales)
// El placeholder cubre los escudos que no existen como archivo (p.ej. varias
// selecciones del Mundial 2026, cuya carpeta no está).
function escudoFallback(img) {
  if (!img) return;
  if (!img.dataset.svgTry) {
    img.dataset.svgTry = "1";
    img.src = img.src.replace(/\.webp(\?.*)?$/i, ".svg");
    return;
  }
  if (!img.dataset.phTry) {
    img.dataset.phTry = "1";
    img.src = _escudoPlaceholder(img.alt || img.title || "");
  }
}

// Placeholder: disco oscuro con borde dorado y las iniciales del equipo.
function _escudoPlaceholder(nombre) {
  const palabras = String(nombre).replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/).filter(Boolean);
  let ini;
  if (palabras.length >= 2) ini = palabras.map(w => w[0]).join("").slice(0, 3).toUpperCase();
  else ini = (palabras[0] || "?").slice(0, 3).toUpperCase();
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
    "<circle cx='50' cy='50' r='46' fill='#243049' stroke='#c8a84b' stroke-width='3'/>" +
    "<text x='50' y='63' font-size='34' text-anchor='middle' fill='#ffe08a' " +
    "font-family='Arial,sans-serif' font-weight='700'>" + ini + "</text></svg>";
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
function buscarEquipo(id) {
  // Busca en las ligas visibles y también en las de Libertadores (Brasil,
  // Colombia, Ecuador, Venezuela), que no se muestran pero sus clubes existen.
  const fuentes = (typeof LIGAS_LIBERTADORES !== "undefined") ? LIGAS.concat(LIGAS_LIBERTADORES) : LIGAS;
  for (const liga of fuentes) {
    const eq = liga.equipos.find(e => e.id === id);
    if (eq) return { liga, equipo: eq };
  }
  return null;
}

const EQ_KEY = "truco_equipo";
let equipoSel = null;   // equipo del jugador
let equipoRival = null; // equipo de la IA

// ── PARTIDO AMISTOSO — el jugador elige ambos equipos ──
let modoAmistoso   = false; // true mientras dura un partido amistoso
let amistosoEquipoJ = null; // equipo elegido para el jugador
let amistosoEquipoR = null; // equipo elegido para el rival

// ── MUNDIAL 2026 — rival fijado por el fixture/cuadro, no se sortea ──
let modoMundial = false; // true mientras dura un partido del Mundial (ver mundial.js)

// true mientras se RETOMA una partida guardada: evita que aplicarEquipoEnMesa
// re-sortee el rival (queremos respetar el equipo guardado).
let _retomando = false;

// true mientras se juega un partido de una COPA (Libertadores / Champions /
// Mundial de Clubes). El rival ya viene fijado por el cuadro, igual que el Mundial.
let modoCopa = false;

/* ── Selector agrupado: cada liga se arma como bloque .eq-cat colapsable ── */
function _crearEqCat(liga, abierta, onSelect, preseleccionadoId, onPreseleccion) {
  const sec = document.createElement("div");
  sec.className = "eq-cat" + (abierta ? " open" : "");

  // Encabezado de la categoría: logo + nombre + cantidad + flecha
  const hdr = document.createElement("div");
  hdr.className = "eq-cat-header";
  hdr.innerHTML =
    '<img class="eq-cat-logo" src="' + liga.logo + '" alt="' + liga.nombre + '">' +
    '<div class="eq-cat-textos">' +
      '<span class="eq-cat-name">' + liga.nombre + '</span>' +
      '<span class="eq-cat-badge">' + liga.badge + ' · ' + liga.equipos.length + ' equipos</span>' +
    '</div>' +
    '<span class="eq-cat-arrow">▾</span>';
  hdr.onclick = () => sec.classList.toggle("open");

  // Grilla de equipos
  const grid = document.createElement("div");
  grid.className = "equipo-grid";

  liga.equipos.forEach(eq => {
    const card = document.createElement("div");
    card.className = "eq-card";
    card.title = eq.nombre + " · " + eq.sub;
    card.innerHTML =
      '<img src="' + escudoDe(eq) + '" alt="' + eq.nombre + '" onerror="escudoFallback(this)">' +
      '<span class="eq-nombre">' + eq.nombre + '</span>';
    card.onclick = (ev) => { ev.stopPropagation(); onSelect(eq, card); };
    grid.appendChild(card);
    if (preseleccionadoId === eq.id && onPreseleccion) onPreseleccion(eq, card);
  });

  sec.appendChild(hdr);
  sec.appendChild(grid);
  return sec;
}

/* Vuelca todas las LIGAS dentro de cont, agrupadas por región
   (Sudamérica / Europa / Selecciones) con su título de sección. */
function _renderRegiones(cont, abrirCriterio, onSelect, preseleccionadoId, onPreseleccion) {
  REGIONES.forEach((region, ridx) => {
    const ligasRegion = LIGAS.filter(l => (l.region || "sudamerica") === region.key);
    if (!ligasRegion.length) return;

    const wrap = document.createElement("div");
    wrap.className = "eq-region";

    const titulo = document.createElement("div");
    titulo.className = "eq-region-title";
    titulo.textContent = region.nombre;
    wrap.appendChild(titulo);

    ligasRegion.forEach((liga, idx) => {
      const abierta = abrirCriterio(liga, ridx === 0 && idx === 0);
      const sec = _crearEqCat(liga, abierta, (eq, card) => onSelect(eq, card, liga), preseleccionadoId, onPreseleccion);
      wrap.appendChild(sec);
    });

    cont.appendChild(wrap);
  });
}

/* ── Selector agrupado en la pantalla de registro ── */
function renderSelectorEquipos() {
  const cont = document.getElementById("eq-cat-container");
  if (!cont) return;
  cont.innerHTML = "";

  const guardado = localStorage.getItem(EQ_KEY);
  const seleccion = guardado ? buscarEquipo(guardado) : null;

  _renderRegiones(
    cont,
    (liga, esPrimera) => seleccion ? seleccion.liga.id === liga.id : esPrimera,
    (eq, card) => seleccionarEquipo(eq, card),
    guardado,
    (eq, card) => seleccionarEquipo(eq, card, true)
  );
}

function seleccionarEquipo(eq, card, silencioso) {
  equipoSel = eq;
  const encontrado = buscarEquipo(eq.id);
  if (encontrado) LIGA = encontrado.liga;
  lsSet(EQ_KEY, eq.id);
  document.querySelectorAll(".eq-card").forEach(c => c.classList.remove("activo"));
  if (card) card.classList.add("activo");
  const lbl = document.getElementById("equipo-elegido-lbl");
  if (lbl) lbl.textContent = "⚽ " + eq.nombre + " — " + eq.sub;
  if (!silencioso && typeof showToast === "function") {
    try { showToast("Elegiste " + eq.nombre + " 🏆"); } catch (e) {}
  }
}

/* ── Aplicar escudos en la mesa ── */
function aplicarEquipoEnMesa() {
  // En Partido Amistoso y en el Mundial el rival ya está fijado: no se sortea.
  // Al RETOMAR una partida (_retomando) tampoco: el rival guardado se respeta.
  if (!modoAmistoso && !modoMundial && !modoCopa && !_retomando) {
    const pool = LIGA.equipos.filter(e => !equipoSel || e.id !== equipoSel.id);
    equipoRival = pool[Math.floor(Math.random() * pool.length)];
  }

  const escJ = document.getElementById("player-escudo");
  if (escJ && equipoSel) {
    escJ.onerror = () => escudoFallback(escJ);
    escJ.src = escudoDe(equipoSel);
    escJ.style.display = "inline-block";
    escJ.title = equipoSel.nombre;
  }

  const escR = document.getElementById("rival-escudo");
  if (escR && equipoRival && equipoSel) {
    escR.onerror = () => escudoFallback(escR);
    escR.src = escudoDe(equipoRival);
    escR.style.display = "inline-block";
    escR.title = equipoRival.nombre;
  }

  if (equipoSel) {
    const el = document.getElementById("side-pbar-j");
    if (el) el.style.background = equipoSel.color;
  }

  // La dificultad de la IA depende del rival recién asignado
  if (typeof _renderDificultadIA === "function") _renderDificultadIA();
}

/* ══════════════════════════════════════════════════════════
   PARTIDO AMISTOSO — el jugador elige su equipo Y el del rival
   ══════════════════════════════════════════════════════════ */

/* Renderiza un selector de equipos (todas las ligas) dentro de
   cualquier contenedor, llamando a onSelect(equipo, card) al elegir. */
function _renderSelectorEquiposEn(contId, onSelect) {
  const cont = document.getElementById(contId);
  if (!cont) return;
  cont.innerHTML = "";

  _renderRegiones(
    cont,
    (liga, esPrimera) => esPrimera,
    (eq, card) => onSelect(eq, card)
  );
}

function _actualizarBotonAmistoso() {
  const btn = document.getElementById("btn-jugar-amistoso");
  if (btn) btn.disabled = !(amistosoEquipoJ && amistosoEquipoR);
}

/* Arma los dos selectores (mi equipo / rival) de la pantalla de amistoso */
function renderSelectorAmistoso() {
  _renderSelectorEquiposEn("eq-cat-container-amistoso-j", (eq, card) => {
    amistosoEquipoJ = eq;
    document.querySelectorAll("#eq-cat-container-amistoso-j .eq-card").forEach(c => c.classList.remove("activo"));
    if (card) card.classList.add("activo");
    const lbl = document.getElementById("amistoso-eq-j-lbl");
    if (lbl) lbl.textContent = "⚽ " + eq.nombre + " — " + eq.sub;
    _actualizarBotonAmistoso();
  });

  _renderSelectorEquiposEn("eq-cat-container-amistoso-r", (eq, card) => {
    amistosoEquipoR = eq;
    document.querySelectorAll("#eq-cat-container-amistoso-r .eq-card").forEach(c => c.classList.remove("activo"));
    if (card) card.classList.add("activo");
    const lbl = document.getElementById("amistoso-eq-r-lbl");
    if (lbl) lbl.textContent = "⚽ " + eq.nombre + " — " + eq.sub;
    _actualizarBotonAmistoso();
  });
}

/* Restaura el club/liga del Modo DT (por si quedaron pisados por un amistoso) */
function restaurarEquipoDT() {
  const guardado = localStorage.getItem(EQ_KEY);
  if (guardado) {
    const encontrado = buscarEquipo(guardado);
    if (encontrado) { equipoSel = encontrado.equipo; LIGA = encontrado.liga; }
  }
}

/* ══════════════════════════════════════════════════════════
   RETOMAR PARTIDA 1 JUGADOR
   Guarda el marcador del partido contra la IA entre manos
   (nunca a mitad de mano) y permite retomarlo si se cierra el
   juego. Solo modos "dt" y "amistoso"; online y mundial tienen
   su propio flujo y no se guardan acá.
   ══════════════════════════════════════════════════════════ */
const PARTIDA_KEY = "truco_partida_1p";

function _partidaModoTag() {
  if (typeof S !== "undefined" && S.modoOnline) return null;
  if (typeof modoMundial  !== "undefined" && modoMundial)  return null;
  if (typeof modoCopa     !== "undefined" && modoCopa)     return null;
  if (typeof modoAmistoso !== "undefined" && modoAmistoso) return "amistoso";
  return "dt";
}

function partidaGuardarSnapshot() {
  const tag = _partidaModoTag();
  if (!tag || S.juegoTerminado) return;
  const snap = {
    tag, ts: Date.now(),
    ptsJ: S.puntosJugador, ptsR: S.puntosRival, limite: S.limitePuntos,
    turnoMano: S.turnoMano, idRival: S.idRival,
    nombre: S.nombreJugador, avatar: S.avatarJugador,
    eqJ: equipoSel  ? equipoSel.id  : null,
    eqR: equipoRival ? equipoRival.id : null,
  };
  if (typeof lsSet === "function") lsSet(PARTIDA_KEY, JSON.stringify(snap));
  else { try { localStorage.setItem(PARTIDA_KEY, JSON.stringify(snap)); } catch (e) {} }
}

function partidaCargarSnapshot() {
  try { return JSON.parse(localStorage.getItem(PARTIDA_KEY)); } catch (e) { return null; }
}
function partidaBorrarSnapshot() {
  try { localStorage.removeItem(PARTIDA_KEY); } catch (e) {}
}

function retomarPartida() {
  const s = partidaCargarSnapshot();
  if (!s) return;

  S.modoOnline   = false;
  modoAmistoso   = (s.tag === "amistoso");
  if (typeof modoMundial !== "undefined") modoMundial = false;

  S.puntosJugador = s.ptsJ || 0;
  S.puntosRival   = s.ptsR || 0;
  S.limitePuntos  = s.limite || 30;
  S.nombreJugador = s.nombre || S.nombreJugador;
  S.avatarJugador = s.avatar || S.avatarJugador;
  S.idRival       = (typeof s.idRival === "number") ? s.idRival : 0;
  S.juegoTerminado = false;

  if (s.eqJ) { const e = buscarEquipo(s.eqJ); if (e) { equipoSel = e.equipo; LIGA = e.liga; } }
  if (s.eqR) { const e = buscarEquipo(s.eqR); if (e) equipoRival = e.equipo; }

  // Pre-flip: repartirNuevaMano alterna el "mano" al arrancar, así que
  // dejamos el opuesto para que la mano repartida tenga el mano guardado.
  S.turnoMano = (s.turnoMano === "jugador") ? "rival" : "jugador";

  if (typeof irA === "function") irA("mesa");
  if (typeof _emitJuego === "function") _emitJuego("nuevoPartido");

  // Pintar escudos sin re-sortear el rival guardado
  _retomando = true;
  if (typeof aplicarEquipoEnMesa === "function") aplicarEquipoEnMesa();
  _retomando = false;

  if (typeof showToast === "function") showToast("🔄 Partida retomada");
  repartirNuevaMano();
}

/* Inyecta/actualiza el botón "Retomar partida" arriba del menú principal,
   solo si hay una partida 1J guardada con progreso. */
function montarBotonRetomar() {
  const nav = document.querySelector(".mm-nav");
  if (!nav) return;
  const s = partidaCargarSnapshot();
  let btn = document.getElementById("mm-btn-retomar");
  const hayProgreso = s && (s.ptsJ > 0 || s.ptsR > 0);

  if (!hayProgreso) { if (btn) btn.remove(); return; }

  const nomRival = (AVATARS[s.idRival] && AVATARS[s.idRival].name) || "Rival";
  const sub = `Vos ${s.ptsJ} – ${s.ptsR} ${nomRival} · ${s.tag === "amistoso" ? "Amistoso" : "Modo DT"}`;
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "mm-btn-retomar";
    btn.className = "mm-btn mm-btn-primary";
    btn.onclick = retomarPartida;
    nav.insertBefore(btn, nav.firstChild);
  }
  btn.innerHTML =
    '<span class="mm-btn-icon">🔄</span>' +
    '<span class="mm-btn-text"><strong>RETOMAR PARTIDA</strong><small>' + sub + '</small></span>';
}

/* Suscripciones al motor: guardar al repartir cada mano, borrar al terminar. */
if (typeof onJuego === "function") {
  onJuego("manoRepartida", partidaGuardarSnapshot);
  onJuego("finDePartido",  partidaBorrarSnapshot);
}

/* Mostrar/refrescar el botón al llegar al menú principal. */
window.addEventListener("load", () => { setTimeout(montarBotonRetomar, 400); });
if (typeof window.irA === "function") {
  const _irAprev = window.irA;
  window.irA = function (destino) {
    _irAprev.apply(this, arguments);
    if (destino === "main-menu") setTimeout(montarBotonRetomar, 30);
  };
}

/* Arranca el partido amistoso con los dos equipos elegidos por el jugador */
function iniciarPartidoAmistoso() {
  if (!amistosoEquipoJ || !amistosoEquipoR) {
    if (typeof showToast === "function") showToast("Elegí los dos equipos para el amistoso ⚽");
    return;
  }
  modoAmistoso = true;
  equipoSel   = amistosoEquipoJ;
  equipoRival = amistosoEquipoR;
  const encJ = buscarEquipo(equipoSel.id);
  if (encJ) LIGA = encJ.liga;

  if (typeof window.setName === "function") window.setName();
}

/* ── Hook: envolver setName() sin tocar juego_ui.js ── */
document.addEventListener("DOMContentLoaded", () => {
  renderSelectorEquipos();
  renderSelectorAmistoso();

  const guardado = localStorage.getItem(EQ_KEY);
  if (guardado) {
    const encontrado = buscarEquipo(guardado);
    if (encontrado) { equipoSel = encontrado.equipo; LIGA = encontrado.liga; }
  }

  if (typeof window.setName === "function") {
    const setNameOriginal = window.setName;
    window.setName = function () {
      setNameOriginal.apply(this, arguments);
      setTimeout(aplicarEquipoEnMesa, 50);
    };
  }
});
