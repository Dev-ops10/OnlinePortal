-- ============================================================
-- SEED DATA - Run after schema.sql
-- Creates sample products for testing
-- ============================================================

INSERT INTO public.products (item_name, sku, item_group, customer_groups, unit_of_measure) VALUES
  ('Commercial Gas Range - 6 Burner', 'EQ-1001', 'Cooking Equipment', ARRAY['Chain A', 'Independent B'], 'EA'),
  ('Convection Oven - Full Size', 'EQ-1002', 'Cooking Equipment', ARRAY['Chain A'], 'EA'),
  ('Commercial Fryer - 40lb', 'EQ-1003', 'Cooking Equipment', ARRAY['Chain A', 'Independent B'], 'EA'),
  ('Reach-In Refrigerator - 2 Door', 'RF-2001', 'Refrigeration', ARRAY['Chain A', 'Independent B'], 'EA'),
  ('Walk-In Cooler Panel Kit', 'RF-2002', 'Refrigeration', ARRAY['Chain A'], 'EA'),
  ('Prep Table - Refrigerated 72"', 'RF-2003', 'Refrigeration', ARRAY['Independent B'], 'EA'),
  ('Sheet Pan - Full Size 18x26', 'SW-3001', 'Smallwares', ARRAY['Chain A', 'Independent B'], 'EA'),
  ('Hotel Pan 1/6 Size - 6" Deep', 'SW-3002', 'Smallwares', ARRAY['Chain A', 'Independent B'], 'EA'),
  ('Chef Knife - 10" German Steel', 'SW-3003', 'Smallwares', ARRAY['Chain A', 'Independent B'], 'EA'),
  ('Cutting Board - 18x24 NSF', 'SW-3004', 'Smallwares', ARRAY['Chain A', 'Independent B'], 'EA'),
  ('Tongs - 12" Scalloped', 'SW-3005', 'Smallwares', ARRAY['Chain A', 'Independent B'], 'DZ'),
  ('Bus Tub - 20x15x7 Gray', 'SW-3006', 'Smallwares', ARRAY['Independent B'], 'EA'),
  ('Wire Shelving Unit - 48x18x72', 'ST-4001', 'Storage', ARRAY['Chain A', 'Independent B'], 'EA'),
  ('Food Storage Container - 22qt', 'ST-4002', 'Storage', ARRAY['Chain A', 'Independent B'], 'EA'),
  ('Speed Rack - 20 Tier', 'ST-4003', 'Storage', ARRAY['Chain A'], 'EA'),
  ('Commercial Dishwasher - High Temp', 'WR-5001', 'Warewashing', ARRAY['Chain A'], 'EA'),
  ('3-Compartment Sink - 18x18', 'WR-5002', 'Warewashing', ARRAY['Chain A', 'Independent B'], 'EA'),
  ('Disposable Gloves - Nitrile L', 'DS-6001', 'Disposables', ARRAY['Chain A', 'Independent B'], 'CS'),
  ('Aluminum Foil - Heavy Duty 18"', 'DS-6002', 'Disposables', ARRAY['Chain A', 'Independent B'], 'RL'),
  ('To-Go Container - 9x9 3-Comp', 'DS-6003', 'Disposables', ARRAY['Independent B'], 'CS')
ON CONFLICT (sku) DO UPDATE SET
  item_name = EXCLUDED.item_name,
  item_group = EXCLUDED.item_group,
  customer_groups = EXCLUDED.customer_groups,
  unit_of_measure = EXCLUDED.unit_of_measure,
  updated_at = NOW();
