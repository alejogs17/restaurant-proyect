-- Crear tablas para facturación y pagos

-- Crear tabla de facturas
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actualizar tabla de pagos con métodos colombianos
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check 
  CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'mobile_payment', 'bank_transfer', 'other'));

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- Crear políticas RLS para facturas
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver facturas"
  ON invoices FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins y cajeros pueden crear facturas"
  ON invoices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'cashier')
    )
  );

CREATE POLICY "Solo admins y cajeros pueden actualizar facturas"
  ON invoices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'cashier')
    )
  );

-- Actualizar políticas de pagos
DROP POLICY IF EXISTS "Solo admins pueden crear pagos" ON payments;

CREATE POLICY "Solo admins y cajeros pueden crear pagos"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'cashier')
    )
  );

-- Insertar datos de ejemplo para facturas
INSERT INTO invoices (invoice_number, order_id, customer_name, customer_email, customer_phone, subtotal, tax, total, status, due_date)
SELECT 
  'FAC-' || LPAD(ROW_NUMBER() OVER (ORDER BY o.id)::TEXT, 6, '0'),
  o.id,
  COALESCE(o.customer_name, 'Cliente General'),
  CASE WHEN o.customer_name IS NOT NULL THEN o.customer_name || '@email.com' ELSE NULL END,
  CASE WHEN o.customer_name IS NOT NULL THEN '300' || LPAD((RANDOM() * 9999999)::INT::TEXT, 7, '0') ELSE NULL END,
  o.subtotal,
  o.tax,
  o.total,
  CASE 
    WHEN o.status = 'completed' THEN 'paid'
    WHEN o.status = 'delivered' THEN 'sent'
    ELSE 'draft'
  END,
  CURRENT_DATE + INTERVAL '30 days'
FROM orders o
WHERE o.status IN ('delivered', 'completed')
AND NOT EXISTS (SELECT 1 FROM invoices WHERE order_id = o.id)
LIMIT 10;

-- Insertar datos de ejemplo para pagos
INSERT INTO payments (order_id, payment_method, amount, user_id, reference_number)
SELECT 
  o.id,
  CASE 
    WHEN RANDOM() < 0.4 THEN 'cash'
    WHEN RANDOM() < 0.6 THEN 'credit_card'
    WHEN RANDOM() < 0.8 THEN 'debit_card'
    WHEN RANDOM() < 0.9 THEN 'mobile_payment'
    ELSE 'bank_transfer'
  END,
  o.total,
  (SELECT id FROM auth.users LIMIT 1),
  CASE 
    WHEN RANDOM() > 0.5 THEN 'REF-' || LPAD((RANDOM() * 999999)::INT::TEXT, 6, '0')
    ELSE NULL
  END
FROM orders o
WHERE o.status = 'completed'
AND NOT EXISTS (SELECT 1 FROM payments WHERE order_id = o.id)
LIMIT 15;

-- Función para generar número de factura automático
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_month TEXT;
  sequence_num INTEGER;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'FAC-' || year_month || '-(.*)') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM invoices
  WHERE invoice_number LIKE 'FAC-' || year_month || '-%';
  
  RETURN 'FAC-' || year_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar número de factura automáticamente
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_number();

-- Función para crear pago automático cuando una factura se marca como pagada
CREATE OR REPLACE FUNCTION create_payment_on_invoice_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear pago si el estado cambió a 'paid' y no existía antes
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Verificar que no existe ya un pago para esta factura
    IF NOT EXISTS (
      SELECT 1 FROM payments 
      WHERE order_id = NEW.order_id 
      AND amount = NEW.total
    ) THEN
      -- Crear el pago automáticamente
      INSERT INTO payments (
        order_id,
        payment_method,
        amount,
        user_id,
        reference_number,
        notes,
        payment_date
      ) VALUES (
        NEW.order_id,
        'cash', -- Método por defecto, se puede cambiar manualmente después
        NEW.total,
        auth.uid(), -- Usuario que marcó la factura como pagada
        'AUTO-' || NEW.invoice_number, -- Referencia automática
        'Pago automático generado al marcar factura como pagada',
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear pago automático
DROP TRIGGER IF EXISTS trigger_create_payment_on_invoice_paid ON invoices;
CREATE TRIGGER trigger_create_payment_on_invoice_paid
  AFTER UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION create_payment_on_invoice_paid();
