CREATE OR REPLACE FUNCTION update_inventory_quantity(p_item_id INT, p_quantity_change DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE inventory_items
  SET quantity = quantity + p_quantity_change
  WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 