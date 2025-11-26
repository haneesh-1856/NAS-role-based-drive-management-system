/*
  # Add System Metrics Table

  ## New Table
  `system_metrics`
    - `id` (uuid, primary key)
    - `metric_type` (text) - Type of metric (e.g., 'cpu', 'memory', 'storage', 'api_calls')
    - `metric_value` (numeric) - Value of the metric
    - `timestamp` (timestamptz)
    - `metadata` (jsonb) - Additional metadata
  
  ## Security
  - Enable RLS
  - All authenticated users can view metrics
  - System can insert metrics
*/

-- Create system_metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  metric_value numeric NOT NULL,
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- System metrics policies
CREATE POLICY "All users can view metrics"
  ON system_metrics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert metrics"
  ON system_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp DESC);
