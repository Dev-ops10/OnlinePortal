-- ============================================================
-- SEED DATA - Run after schema.sql
-- Creates sample products for testing
-- ============================================================

INSERT INTO public.products (item_name, sku, item_group, price, customer_groups, unit_of_measure, description) VALUES
  ('Commercial Gas Range - 6 Burner', 'EQ-1001', 'Cooking Equipment', 2849.99, ARRAY['Chain A', 'Independent B'], 'EA', 'Heavy-duty 6-burner gas range with oven'),
  ('Convection Oven - Full Size', 'EQ-1002', 'Cooking Equipment', 4299.00, ARRAY['Chain A'], 'EA', 'Full-size electric convection oven'),
  ('Commercial Fryer - 40lb', 'EQ-1003', 'Cooking Equipment', 1599.00, ARRAY['Chain A', 'Independent B'], 'EA', 'Floor-standing 40lb capacity gas fryer'),
  ('Reach-In Refrigerator - 2 Door', 'RF-2001', 'Refrigeration', 3199.00, ARRAY['Chain A', 'Independent B'], 'EA', 'Two-door stainless steel reach-in refrigerator'),
  ('Walk-In Cooler Panel Kit', 'RF-2002', 'Refrigeration', 8499.00, ARRAY['Chain A'], 'EA', '8x10 walk-in cooler panel kit'),
  ('Prep Table - Refrigerated 72"', 'RF-2003', 'Refrigeration', 2299.00, ARRAY['Independent B'], 'EA', '72-inch refrigerated sandwich/salad prep table'),
  ('Sheet Pan - Full Size 18x26', 'SW-3001', 'Smallwares', 12.99, ARRAY['Chain A', 'Independent B'], 'EA', 'Aluminum full-size sheet pan'),
  ('Hotel Pan 1/6 Size - 6" Deep', 'SW-3002', 'Smallwares', 8.49, ARRAY['Chain A', 'Independent B'], 'EA', 'Stainless steel 1/6 size hotel pan'),
  ('Chef Knife - 10" German Steel', 'SW-3003', 'Smallwares', 89.99, ARRAY['Chain A', 'Independent B'], 'EA', 'Professional 10-inch chef knife'),
  ('Cutting Board - 18x24 ?"NSF', 'SW-3004', 'Smallwares', 34.99, ARRAY['Chain A', 'Independent B'], 'EA', 'NSF-approved polyethylene cutting board'),
  ('Tongs - 12" Scalloped', 'SW-3005', 'Smallwares', 6.99, ARRAY['Chain A', 'Independent B'], 'DZ', 'Heavy-duty stainless steel utility tongs'),
  ('Bus Tub - 20x15x7 Gray', 'SW-3006', 'Smallwares', 4.99, ARRAY['Independent B'], 'EA', 'Standard bus tub'),
  ('Wire Shelving Unit - 48x18x72', 'ST-4001', 'Storage', 189.00, ARRAY['Chain A', 'Independent B'], 'EA', '4-tier chrome wire shelving unit'),
  ('Food Storage Container - 22qt', 'ST-4002', 'Storage', 24.99, ARRAY['Chain A', 'Independent B'], 'EA', 'NSF polycarbonate food storage container'),
  ('Speed Rack - 20 Tier', 'ST-4003', 'Storage', 159.00, ARRAY['Chain A'], 'EA', 'Aluminum sheet pan speed rack'),
  ('Commercial Dishwasher - High Temp', 'WR-5001', 'Warewashing', 5999.00, ARRAY['Chain A'], 'EA', 'Door-type high-temperature commercial dishwasher'),
  ('3-Compartment Sink - 18x18', 'WR-5002', 'Warewashing', 899.00, ARRAY['Chain A', 'Independent B'], 'EA', 'Three-compartment stainless steel sink'),
  ('Disposable Gloves - Nitrile L', 'DS-6001', 'Disposables', 29.99, ARRAY['Chain A', 'Independent B'], 'CS', 'Large nitrile disposable gloves - 1000/case'),
  ('Aluminum Foil - Heavy Duty 18"', 'DS-6002', 'Disposables', 42.99, ARRAY['Chain A', 'Independent B'], 'RL', 'Heavy-duty aluminum foil roll 18" x 500ft'),
  ('To-Go Container - 9x9 3-Comp', 'DS-6003', 'Disposables', 64.99, ARRAY['Independent B'], 'CS', 'Hinged foam container 3-compartment - 200/case')
ON CONFLICT (sku) DO UPDATE SET
  item_name = EXCLUDED.item_name,
  item_group = EXCLUDED.item_group,
  price = EXCLUDED.price,
  customer_groups = EXCLUDED.customer_groups,
  unit_of_measure = EXCLUDED.unit_of_measure,
  description = EXCLUDED.description,
  updated_at = NOW();
