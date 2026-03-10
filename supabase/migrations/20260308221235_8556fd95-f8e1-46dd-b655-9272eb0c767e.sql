
-- Performance indexes for marketplace search
CREATE INDEX IF NOT EXISTS idx_properties_city_area_active ON public.properties (city, area, is_active);
CREATE INDEX IF NOT EXISTS idx_properties_active_rating ON public.properties (is_active, rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_rooms_property_status ON public.rooms (property_id, status);
CREATE INDEX IF NOT EXISTS idx_beds_room_status ON public.beds (room_id, status);
CREATE INDEX IF NOT EXISTS idx_beds_status ON public.beds (status);
CREATE INDEX IF NOT EXISTS idx_landmarks_city ON public.landmarks (city);
CREATE INDEX IF NOT EXISTS idx_properties_coords ON public.properties (latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations (reservation_status);
CREATE INDEX IF NOT EXISTS idx_soft_locks_active ON public.soft_locks (is_active, expires_at) WHERE is_active = true;
