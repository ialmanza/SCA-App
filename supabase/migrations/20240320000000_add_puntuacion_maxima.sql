-- Add puntuacion_maxima column to comparison_modes table
ALTER TABLE comparison_modes
ADD COLUMN puntuacion_maxima INTEGER;

-- Update existing rows to set puntuacion_maxima to NULL
UPDATE comparison_modes
SET puntuacion_maxima = NULL; 