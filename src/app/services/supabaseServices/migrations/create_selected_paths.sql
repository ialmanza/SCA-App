-- Tabla de rutas seleccionadas
CREATE TABLE selected_paths (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    hex_code VARCHAR(10) NOT NULL,
    path TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Trigger para updated_at
CREATE TRIGGER update_selected_paths_updated_at
    BEFORE UPDATE ON selected_paths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE selected_paths ENABLE ROW LEVEL SECURITY;

-- Política RLS
CREATE POLICY "Access project-linked data" ON selected_paths
    FOR ALL TO authenticated
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Índice recomendado
CREATE INDEX idx_selected_paths_project_id ON selected_paths(project_id); 