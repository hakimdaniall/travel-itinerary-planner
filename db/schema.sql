-- Travel Itinerary Analytics Schema for Neon DB

-- Create the analytics table
CREATE TABLE IF NOT EXISTS trip_analytics (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('generated', 'saved', 'exported')),
    trip_destination VARCHAR(255),
    trip_days INTEGER,
    trip_budget DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    session_id VARCHAR(100)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_type ON trip_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_created_at ON trip_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_session_id ON trip_analytics(session_id);

-- Create a view for easy analytics queries
CREATE OR REPLACE VIEW trip_analytics_summary AS
SELECT 
    event_type,
    COUNT(*) as total_count,
    DATE(created_at) as date
FROM trip_analytics
GROUP BY event_type, DATE(created_at)
ORDER BY date DESC, event_type;

-- Create a view for daily statistics
CREATE OR REPLACE VIEW daily_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(CASE WHEN event_type = 'generated' THEN 1 END) as generated_count,
    COUNT(CASE WHEN event_type = 'saved' THEN 1 END) as saved_count,
    COUNT(CASE WHEN event_type = 'exported' THEN 1 END) as exported_count,
    COUNT(*) as total_events
FROM trip_analytics
GROUP BY DATE(created_at)
ORDER BY date DESC;
