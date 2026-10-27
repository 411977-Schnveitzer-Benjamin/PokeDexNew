# 🔴 Pokédex Kanto - Primera Generación (Gen 1)

¡Bienvenido al proyecto personal de la **Pokédex de Kanto**! Una interfaz web moderna, ágil y visualmente atractiva con los **151 Pokémon originales** de la primera generación (#001 Bulbasaur a #151 Mew).

---

## ✨ Características Principales

- **Diseño Pokédex Cyber-Moderno**: Estética con acabados en glassmorphism, luces sensoriales clásicas animadas (sensor azul pulsante y LEDs de estado), gradientes suaves y soporte para pantallas móviles, tablets y monitores 4K.
- **Colección Completa Gen 1 (151 Pokémon)**:
  - Ilustraciones oficiales en alta definición (`official-artwork`).
  - Nombres y descripciones de la Pokédex oficiales en **Español**.
  - Categorías de especie (*Pokémon Ratón*, *Pokémon Semilla*, *Pokémon Llama*, etc.).
  - Tipos duales y estadísticas base completas (*PS*, *Ataque*, *Defensa*, *Atq. Esp.*, *Def. Esp.*, *Velocidad* y *BST*).
- **Scanner Modal Interactivo**:
  - Haz clic en cualquier tarjeta para abrir el escáner detallado.
  - **Alternador Shiny (✨)**: Mira la versión normal o variocolor con un solo clic.
  - **Efectividades de combate**: Cálculo dinámico de debilidades (*2x* o *4x*) y resistencias (*0.5x*, *0x*).
  - **Navegación fluida**: Flechas para pasar al Pokémon anterior y siguiente directamente desde el modal, o con las teclas `←` y `→` de tu teclado.
- **Sonidos Oficiales (Gritos de Pokémon)**:
  - Botón de audio en cada tarjeta y en el modal para reproducir el grito característico de cada Pokémon.
- **Búsqueda y Filtros en Tiempo Real**:
  - Búsqueda instantánea por nombre o número (ej: *Pikachu*, *#025*, *Charizard*). Atajo de teclado: presiona `/` para buscar rápidamente.
  - Carrusel de filtros por tipos elementales (*Planta*, *Fuego*, *Agua*, *Eléctrico*, etc.).
  - Criterios de ordenamiento: por número (ascendente/descendente), nombre (A-Z, Z-A), mayor puntuación de combate (*BST*) o velocidad.
- **Sistema de Favoritos**:
  - Guarda tus Pokémon favoritos con el ícono de corazón (se guardan automáticamente en tu navegador con `localStorage`).
  - Botón de filtro rápido *"Favoritos"* con contador en vivo.
- **Botón Aleatorio (🎲)**:
  - ¿Indeciso? Presiona *"Aleatorio"* para descubrir y escuchar un Pokémon sorpresa.

---

## 🚀 Cómo Ejecutar el Proyecto

No necesitas instalar frameworks pesados ni configuraciones complejas.

### Opción 1: Abrir directamente en el navegador
Simplemente haz doble clic en el archivo [`index.html`](index.html) para abrirlo en Chrome, Edge, Firefox o tu navegador favorito.

### Opción 2: Con servidor local de Node.js
Si prefieres un servidor local:
```bash
node server.js
```
Luego abre en tu navegador:
```
http://localhost:3000/
```

---

## 📁 Estructura del Proyecto

```text
Pokedex/
├── index.html          # Estructura semántica HTML5 y accesibilidad
├── styles.css          # Estilos CSS modernos, animaciones y glassmorphism
├── app.js              # Lógica interactiva, filtros, cálculo de tipos y eventos
├── pokemon-data.js     # Base de datos local optimizada de los 151 Pokémon
├── server.js           # Servidor estático HTTP local en Node.js
└── README.md           # Documentación del proyecto
```

---

## 🎨 Créditos y Recursos
- Datos, Sprites e Ilustraciones oficiales provistos por [PokéAPI](https://pokeapi.co/).
- Fuentes tipográficas: *Outfit* y *Plus Jakarta Sans* vía Google Fonts.
