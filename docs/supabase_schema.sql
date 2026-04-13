-- ============================================================
-- Wartości Lidera — Supabase Schema v3
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- 1) Drop old tables if exist (order matters for FK)
DROP TABLE IF EXISTS value_mappings CASCADE;
DROP TABLE IF EXISTS schwartz_values CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- 2) Sessions
CREATE TABLE sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code     text NOT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  teams_enabled boolean NOT NULL DEFAULT false,
  max_members   integer NOT NULL DEFAULT 5,
  current_limit integer NOT NULL DEFAULT 10,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 3) Teams (one per leader per session)
CREATE TABLE teams (
  id          text PRIMARY KEY,              -- e.g. "session-uuid_morgan"
  session_id  uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  leader_id   text NOT NULL,                  -- "morgan","oprah","swiatek","obama"
  custom_name text,
  photo       text,                           -- base64 data URL (resized)
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 4) Students
CREATE TABLE students (
  id          text PRIMARY KEY,               -- device fingerprint
  session_id  uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name        text NOT NULL DEFAULT '',
  team_id     text REFERENCES teams(id) ON DELETE SET NULL,
  device_id   text NOT NULL DEFAULT '',       -- for reconnection
  top10       jsonb DEFAULT '[]'::jsonb,
  ranked      jsonb DEFAULT '[]'::jsonb,
  phase       text NOT NULL DEFAULT 'selecting',
  last_seen   timestamptz DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 5) Schwartz Values — 58 reference values (static data)
CREATE TABLE schwartz_values (
  id                  integer PRIMARY KEY,
  name_pl             text NOT NULL,
  name_en             text NOT NULL,
  category            text NOT NULL,           -- e.g. "self-direction","stimulation",...
  schwartz_dimension  text NOT NULL            -- "openness","enhancement","conservation","transcendence"
);

INSERT INTO schwartz_values (id, name_pl, name_en, category, schwartz_dimension) VALUES
(1,'Wolność','Freedom','self-direction','openness'),
(2,'Ciekawość','Curious','self-direction','openness'),
(3,'Kreatywność','Creativity','self-direction','openness'),
(4,'Niezależność','Independent','self-direction','openness'),
(5,'Wybieranie własnych celów','Choosing own goals','self-direction','openness'),
(6,'Prywatność','Privacy','self-direction','openness'),
(7,'Szacunek do siebie','Self-respect','self-direction','openness'),
(8,'Śmiałość','Daring','stimulation','openness'),
(9,'Urozmaicone życie','A varied life','stimulation','openness'),
(10,'Ekscytujące życie','An exciting life','stimulation','openness'),
(11,'Cieszenie się życiem','Enjoying life','hedonism','openness'),
(12,'Pobłażanie sobie','Self-indulgent','hedonism','openness'),
(13,'Przyjemność','Pleasure','hedonism','openness'),
(14,'Inteligencja','Intelligent','achievement','enhancement'),
(15,'Kompetencja','Capable','achievement','enhancement'),
(16,'Sukces','Successful','achievement','enhancement'),
(17,'Ambicja','Ambitious','achievement','enhancement'),
(18,'Wpływowość','Influential','achievement','enhancement'),
(19,'Uznanie społeczne','Social recognition','power','enhancement'),
(20,'Bogactwo','Wealth','power','enhancement'),
(21,'Autorytet','Authority','power','enhancement'),
(22,'Ochrona wizerunku','Preserving my public image','power','enhancement'),
(23,'Władza społeczna','Social power','power','enhancement'),
(24,'Zdrowie','Healthy','security','conservation'),
(25,'Bezpieczeństwo rodziny','Family security','security','conservation'),
(26,'Porządek społeczny','Social order','security','conservation'),
(27,'Czystość','Clean','security','conservation'),
(28,'Poczucie przynależności','Sense of belonging','security','conservation'),
(29,'Odwzajemnianie przysług','Reciprocation of favours','security','conservation'),
(30,'Bezpieczeństwo narodowe','National security','security','conservation'),
(31,'Odpowiedzialność','Responsible','conformity','conservation'),
(32,'Lojalność','Loyal','conformity','conservation'),
(33,'Samodyscyplina','Self-discipline','conformity','conservation'),
(34,'Uprzejmość','Politeness','conformity','conservation'),
(35,'Szacunek dla starszych','Honouring of elders','conformity','conservation'),
(36,'Posłuszeństwo','Obedient','conformity','conservation'),
(37,'Pokora','Humble','tradition','conservation'),
(38,'Dystans','Detachment','tradition','conservation'),
(39,'Szacunek dla tradycji','Respect for tradition','tradition','conservation'),
(40,'Pobożność','Devout','tradition','conservation'),
(41,'Umiarkowanie','Moderate','tradition','conservation'),
(42,'Akceptacja swojego losu','Accepting my portion in life','tradition','conservation'),
(43,'Pomocność','Helpful','benevolence','transcendence'),
(44,'Przebaczenie','Forgiving','benevolence','transcendence'),
(45,'Uczciwość','Honest','benevolence','transcendence'),
(46,'Prawdziwa przyjaźń','True friendship','benevolence','transcendence'),
(47,'Sens życia','Meaning in life','benevolence','transcendence'),
(48,'Dojrzała miłość','Mature love','benevolence','transcendence'),
(49,'Życie duchowe','A spiritual life','benevolence','transcendence'),
(50,'Otwartość umysłu','Broadminded','universalism','transcendence'),
(51,'Równość','Equality','universalism','transcendence'),
(52,'Jedność z naturą','Unity with nature','universalism','transcendence'),
(53,'Ochrona środowiska','Protecting the environment','universalism','transcendence'),
(54,'Wewnętrzna harmonia','Inner harmony','universalism','transcendence'),
(55,'Świat piękna','A world of beauty','universalism','transcendence'),
(56,'Sprawiedliwość społeczna','Social justice','universalism','transcendence'),
(57,'Świat w pokoju','A world at peace','universalism','transcendence'),
(58,'Mądrość','Wisdom','universalism','transcendence');

-- 6) Value Mappings — junction: value ↔ student OR value ↔ team
CREATE TABLE value_mappings (
  id              serial PRIMARY KEY,
  value_id        integer NOT NULL REFERENCES schwartz_values(id),
  student_id      text REFERENCES students(id) ON DELETE CASCADE,
  team_id         text REFERENCES teams(id) ON DELETE CASCADE,
  session_id      uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  mapping_type    text NOT NULL,               -- 'ranked','team_ranked'
  order_position  integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 7) Indexes
CREATE INDEX idx_students_session  ON students(session_id);
CREATE INDEX idx_students_device   ON students(device_id, session_id);
CREATE INDEX idx_teams_session     ON teams(session_id);
CREATE INDEX idx_sessions_active   ON sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_vm_student        ON value_mappings(student_id, mapping_type);
CREATE INDEX idx_vm_team           ON value_mappings(team_id, mapping_type);
CREATE INDEX idx_vm_session        ON value_mappings(session_id);
CREATE INDEX idx_vm_value          ON value_mappings(value_id);

-- 8) Row Level Security — allow anon full access (workshop tool, not public)
ALTER TABLE sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams           ENABLE ROW LEVEL SECURITY;
ALTER TABLE students        ENABLE ROW LEVEL SECURITY;
ALTER TABLE schwartz_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE value_mappings  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_sessions"  ON sessions        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_teams"     ON teams           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_students"  ON students        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_values"    ON schwartz_values  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_mappings"  ON value_mappings   FOR ALL USING (true) WITH CHECK (true);
