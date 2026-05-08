# Tres al Mar · Sistema de Inventario

Control de lotes, productos, movimientos y recursos externos para planta pesquera.

## Stack
- **Backend**: Node.js + Express + Supabase
- **Frontend**: React + Vite
- **Base de datos**: Supabase (PostgreSQL)

---

## Setup rápido

### 1. Clonar y entrar al proyecto
```bash
git clone https://github.com/TU_USUARIO/tres-al-mar.git
cd tres-al-mar
```

### 2. Base de datos
1. Ve a [supabase.com](https://supabase.com) → crea un proyecto
2. En el **SQL Editor**, ejecuta el contenido de `backend/src/config/schema.sql`
3. Copia tu **Project URL** y **anon public key**

### 3. Backend
```bash
cd backend
cp .env.example .env      # llena con tus credenciales Supabase
npm install
npm run dev               # corre en http://localhost:4000
```

### 4. Frontend
```bash
cd frontend
cp .env.example .env      # apunta al backend local
npm install
npm run dev               # corre en http://localhost:5173
```

---

## Estructura
```
tres-al-mar/
├── backend/
│   ├── src/
│   │   ├── config/         ← Supabase client + schema SQL
│   │   ├── controllers/    ← Lógica de negocio por entidad
│   │   ├── entity/         ← Definición de modelos/tipos
│   │   ├── helpers/        ← Utilidades (fechas, validaciones, etc.)
│   │   ├── middleware/      ← Error handler, auth, cors
│   │   ├── routes/         ← Definición de rutas Express
│   │   └── validations/    ← Schemas de validación (Zod)
│   ├── uploads/            ← Archivos subidos (si aplica)
│   ├── index.js            ← Entry point
│   └── package.json
└── frontend/
    ├── public/
    └── src/
        ├── assets/         ← Imágenes, íconos
        ├── components/     ← Componentes reutilizables UI
        ├── context/        ← React Context (estado global)
        ├── hooks/          ← Custom hooks
        ├── pages/          ← Páginas / vistas principales
        ├── services/       ← Llamadas a la API del backend
        ├── styles/         ← CSS global y variables
        └── main.jsx        ← Entry point React
```
