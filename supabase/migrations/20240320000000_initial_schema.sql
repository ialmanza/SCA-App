-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create decision areas table
CREATE TABLE decision_areas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rotulo VARCHAR(7) NOT NULL UNIQUE CHECK (rotulo ~ '^[A-Z]{3}_[A-Z]{3}$'),
    nombre_area VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    is_important BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create options table
CREATE TABLE opciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    descripcion TEXT NOT NULL,
    cod_area UUID NOT NULL REFERENCES decision_areas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create comparison modes table
CREATE TABLE comparison_modes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_num INTEGER NOT NULL,
    peso NUMERIC(5,2) NOT NULL,
    comparison_area VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    puntuacion_minima NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create comparison cells table
CREATE TABLE comparison_cells (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    opcion_id UUID NOT NULL REFERENCES opciones(id) ON DELETE CASCADE,
    mode_id UUID NOT NULL REFERENCES comparison_modes(id) ON DELETE CASCADE,
    value NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(opcion_id, mode_id)
);

-- Create links table (vinculos)
CREATE TABLE vinculos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    area_id UUID NOT NULL REFERENCES decision_areas(id) ON DELETE CASCADE,
    related_area_id UUID NOT NULL REFERENCES decision_areas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(area_id, related_area_id),
    CHECK (area_id != related_area_id)
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message TEXT NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('success', 'error', 'info')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_decision_areas_updated_at
    BEFORE UPDATE ON decision_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opciones_updated_at
    BEFORE UPDATE ON opciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comparison_modes_updated_at
    BEFORE UPDATE ON comparison_modes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comparison_cells_updated_at
    BEFORE UPDATE ON comparison_cells
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vinculos_updated_at
    BEFORE UPDATE ON vinculos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE decision_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE opciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE vinculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON decision_areas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON opciones
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON comparison_modes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON comparison_cells
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON vinculos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON notifications
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_decision_areas_rotulo ON decision_areas(rotulo);
CREATE INDEX idx_opciones_cod_area ON opciones(cod_area);
CREATE INDEX idx_comparison_cells_opcion_mode ON comparison_cells(opcion_id, mode_id);
CREATE INDEX idx_vinculos_areas ON vinculos(area_id, related_area_id); 