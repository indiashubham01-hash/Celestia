# Design System: Royal Circus Velvet (Victorian Electro-Mechanical 3D)

<!-- impeccable:design-schema 1 -->

## World Identity
- **Concept**: Victorian Travelling Circus & Electro-Mechanical Instrument Console (19th-Century Grand Fairground).
- **Tone**: Theatrical, tactile, opulent, scientifically deterministic. Tactile 3D keycaps, gold-gilded accents, royal purple velvet, circus crimson, and warm parchment paper. Zero neon colors.
- **Signature Move**: **3D Keycap Actuators & Ticket Stub Scenarios**: Chunky mechanical navigation tabs with physical keypress travel (`border-b-4`), gold filigree rules, and perforated edge ticket cards.

## Palette
- **Canvas Ground**: `#fdf5e6` (Warm Parchment)
- **Panel / Surface Tint**: `#f5e8cc` (Warm Biscuit / Gilded Cream)
- **Surface Elevation**: `#ffffff` (Chalk Card with warm shadow and gilded edge)
- **Primary / Brand**: `#4c1d95` (Royal Circus Velvet Purple)
- **Primary 3D Shade**: `#3b1575` (Deep Velvet Bevel)
- **Circus Crimson**: `#b91c1c` (Grand Big-Top Carmine)
- **Crimson 3D Shade**: `#991515` (Carmine Bevel)
- **Ringmaster Gold / Brass**: `#b45309` / `#d97706` (Antique Gilded Gold)
- **Gold 3D Shade**: `#924309` (Burnished Brass Bevel)
- **Safety / Equilibrium**: `#15803d` / `#166534` (Emerald Garland)
- **Typography Ink**: `#1c1812` (Deep Charcoal Ink), `#443a2b` (Warm Muted Ink)
- **Borders & Rules**: `#e8d4a8` (Gilded Filament Border)

## Typography
- **Display & Headings**: `Playfair Display`, serif with dramatic Victorian fairground weight.
- **UI Copy & Controls**: `Plus Jakarta Sans`, clean humanist sans for legible dashboards.
- **Numbers & Telemetry**: `JetBrains Mono`, crisp tabular figures for collateral amounts, Health Factors, and price shocks.

## Component Language
- **Cards**: `paper-card` with gilded brass borders (`border-[#e8d4a8]`) and tactile 3D bottom bevel (`border-b-3 border-[#d8c292]`).
- **3D Navigation Tabs**: Keycap style `[1] Portfolio`, `[2] Crash Simulator`, `[3] Alerts` with 3px mechanical bottom relief that depresses on active state.
- **Buttons**: Tactile electro-mechanical keys with explicit 4px bottom border bevels (`border-b-4`) that physically depress on `:active`.
- **Badges**: Stamped gold and crimson ticket stubs with dashed boundaries and antique numerals.
