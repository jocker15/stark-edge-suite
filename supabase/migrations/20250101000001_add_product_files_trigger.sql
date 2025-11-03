-- Add updated_at trigger for product_files table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_files_updated_at 
    BEFORE UPDATE ON product_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
