export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          agent_id: string | null
          created_at: string
          id: string
          lead_id: string
          metadata: Json
        }
        Insert: {
          action: string
          agent_id?: string | null
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json
        }
        Update: {
          action?: string
          agent_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          role: string
          updated_at: string
          user_id: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      bed_status_log: {
        Row: {
          bed_id: string
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["bed_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["bed_status"] | null
        }
        Insert: {
          bed_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["bed_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["bed_status"] | null
        }
        Update: {
          bed_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["bed_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["bed_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "bed_status_log_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
        ]
      }
      beds: {
        Row: {
          bed_number: string
          created_at: string
          current_rent: number | null
          current_tenant_name: string | null
          id: string
          move_in_date: string | null
          move_out_date: string | null
          notes: string | null
          room_id: string
          status: Database["public"]["Enums"]["bed_status"]
          updated_at: string
        }
        Insert: {
          bed_number: string
          created_at?: string
          current_rent?: number | null
          current_tenant_name?: string | null
          id?: string
          move_in_date?: string | null
          move_out_date?: string | null
          notes?: string | null
          room_id: string
          status?: Database["public"]["Enums"]["bed_status"]
          updated_at?: string
        }
        Update: {
          bed_number?: string
          created_at?: string
          current_rent?: number | null
          current_tenant_name?: string | null
          id?: string
          move_in_date?: string | null
          move_out_date?: string | null
          notes?: string | null
          room_id?: string
          status?: Database["public"]["Enums"]["bed_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beds_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          bed_id: string | null
          booked_by: string | null
          booking_status: Database["public"]["Enums"]["booking_status"]
          created_at: string
          id: string
          lead_id: string
          monthly_rent: number | null
          move_in_date: string | null
          move_out_date: string | null
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          property_id: string | null
          room_id: string | null
          security_deposit: number | null
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          bed_id?: string | null
          booked_by?: string | null
          booking_status?: Database["public"]["Enums"]["booking_status"]
          created_at?: string
          id?: string
          lead_id: string
          monthly_rent?: number | null
          move_in_date?: string | null
          move_out_date?: string | null
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          property_id?: string | null
          room_id?: string | null
          security_deposit?: number | null
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          bed_id?: string | null
          booked_by?: string | null
          booking_status?: Database["public"]["Enums"]["booking_status"]
          created_at?: string
          id?: string
          lead_id?: string
          monthly_rent?: number | null
          move_in_date?: string | null
          move_out_date?: string | null
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          property_id?: string | null
          room_id?: string | null
          security_deposit?: number | null
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_booked_by_fkey"
            columns: ["booked_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string | null
          channel: string
          context_id: string | null
          context_type: string | null
          created_at: string
          direction: string
          id: string
          is_pinned: boolean
          lead_id: string
          message: string
        }
        Insert: {
          agent_id?: string | null
          channel?: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          direction: string
          id?: string
          is_pinned?: boolean
          lead_id: string
          message: string
        }
        Update: {
          agent_id?: string | null
          channel?: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          direction?: string
          id?: string
          is_pinned?: boolean
          lead_id?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      escalations: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          priority: string
          raised_by: string | null
          resolved_at: string | null
          status: string
          type: string
          zone_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          priority?: string
          raised_by?: string | null
          resolved_at?: string | null
          status?: string
          type?: string
          zone_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          priority?: string
          raised_by?: string | null
          resolved_at?: string | null
          status?: string
          type?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_reminders: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          is_completed: boolean
          lead_id: string
          note: string | null
          reminder_date: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lead_id: string
          note?: string | null
          reminder_date: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lead_id?: string
          note?: string | null
          reminder_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_reminders_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_reminders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      handoffs: {
        Row: {
          created_at: string
          from_agent_id: string | null
          id: string
          lead_id: string
          reason: string | null
          to_agent_id: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          from_agent_id?: string | null
          id?: string
          lead_id: string
          reason?: string | null
          to_agent_id?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          from_agent_id?: string | null
          id?: string
          lead_id?: string
          reason?: string | null
          to_agent_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handoffs_from_agent_id_fkey"
            columns: ["from_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoffs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoffs_to_agent_id_fkey"
            columns: ["to_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoffs_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      landmarks: {
        Row: {
          area: string | null
          city: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          type: string
        }
        Insert: {
          area?: string | null
          city?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          type?: string
        }
        Update: {
          area?: string | null
          city?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_agent_id: string | null
          budget: string | null
          created_at: string
          email: string | null
          first_response_time_min: number | null
          id: string
          last_activity_at: string
          lead_score: number | null
          name: string
          next_follow_up: string | null
          notes: string | null
          phone: string
          preferred_location: string | null
          property_id: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["pipeline_stage"]
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          assigned_agent_id?: string | null
          budget?: string | null
          created_at?: string
          email?: string | null
          first_response_time_min?: number | null
          id?: string
          last_activity_at?: string
          lead_score?: number | null
          name: string
          next_follow_up?: string | null
          notes?: string | null
          phone: string
          preferred_location?: string | null
          property_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["pipeline_stage"]
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          assigned_agent_id?: string | null
          budget?: string | null
          created_at?: string
          email?: string | null
          first_response_time_min?: number | null
          id?: string
          last_activity_at?: string
          lead_score?: number | null
          name?: string
          next_follow_up?: string | null
          notes?: string | null
          phone?: string
          preferred_location?: string | null
          property_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["pipeline_stage"]
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      owners: {
        Row: {
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          amenities: string[] | null
          area: string | null
          city: string | null
          created_at: string
          description: string | null
          gender_allowed: string | null
          google_maps_link: string | null
          id: string
          is_active: boolean
          is_verified: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          owner_id: string | null
          photos: string[] | null
          price_range: string | null
          property_manager: string | null
          rating: number | null
          total_beds: number | null
          total_reviews: number | null
          total_rooms: number | null
          virtual_tour_link: string | null
          zone_id: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          area?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          gender_allowed?: string | null
          google_maps_link?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          owner_id?: string | null
          photos?: string[] | null
          price_range?: string | null
          property_manager?: string | null
          rating?: number | null
          total_beds?: number | null
          total_reviews?: number | null
          total_rooms?: number | null
          virtual_tour_link?: string | null
          zone_id?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          area?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          gender_allowed?: string | null
          google_maps_link?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          owner_id?: string | null
          photos?: string[] | null
          price_range?: string | null
          property_manager?: string | null
          rating?: number | null
          total_beds?: number | null
          total_reviews?: number | null
          total_rooms?: number | null
          virtual_tour_link?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          bed_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          expires_at: string | null
          id: string
          lead_id: string | null
          monthly_rent: number | null
          move_in_date: string
          payment_reference: string | null
          property_id: string
          reservation_fee: number | null
          reservation_status: string
          room_id: string | null
          room_type: string | null
          soft_lock_id: string | null
          updated_at: string
        }
        Insert: {
          bed_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          expires_at?: string | null
          id?: string
          lead_id?: string | null
          monthly_rent?: number | null
          move_in_date: string
          payment_reference?: string | null
          property_id: string
          reservation_fee?: number | null
          reservation_status?: string
          room_id?: string | null
          room_type?: string | null
          soft_lock_id?: string | null
          updated_at?: string
        }
        Update: {
          bed_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          expires_at?: string | null
          id?: string
          lead_id?: string | null
          monthly_rent?: number | null
          move_in_date?: string
          payment_reference?: string | null
          property_id?: string
          reservation_fee?: number | null
          reservation_status?: string
          room_id?: string | null
          room_type?: string | null
          soft_lock_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_soft_lock_id_fkey"
            columns: ["soft_lock_id"]
            isOneToOne: false
            referencedRelation: "soft_locks"
            referencedColumns: ["id"]
          },
        ]
      }
      room_status_log: {
        Row: {
          confirmed_by: string | null
          created_at: string
          id: string
          notes: string | null
          rent_updated: boolean
          room_id: string
          status: Database["public"]["Enums"]["room_status"]
        }
        Insert: {
          confirmed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rent_updated?: boolean
          room_id: string
          status: Database["public"]["Enums"]["room_status"]
        }
        Update: {
          confirmed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rent_updated?: boolean
          room_id?: string
          status?: Database["public"]["Enums"]["room_status"]
        }
        Relationships: [
          {
            foreignKeyName: "room_status_log_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_status_log_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          actual_rent: number | null
          amenities: string[] | null
          auto_locked: boolean
          bathroom_type: string | null
          bed_count: number
          created_at: string
          expected_rent: number | null
          floor: string | null
          furnishing: string | null
          id: string
          last_confirmed_at: string | null
          min_acceptable_rent: number | null
          notes: string | null
          property_id: string
          rent_per_bed: number | null
          room_code: string | null
          room_number: string
          room_type: string | null
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
          vacating_date: string | null
        }
        Insert: {
          actual_rent?: number | null
          amenities?: string[] | null
          auto_locked?: boolean
          bathroom_type?: string | null
          bed_count?: number
          created_at?: string
          expected_rent?: number | null
          floor?: string | null
          furnishing?: string | null
          id?: string
          last_confirmed_at?: string | null
          min_acceptable_rent?: number | null
          notes?: string | null
          property_id: string
          rent_per_bed?: number | null
          room_code?: string | null
          room_number: string
          room_type?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
          vacating_date?: string | null
        }
        Update: {
          actual_rent?: number | null
          amenities?: string[] | null
          auto_locked?: boolean
          bathroom_type?: string | null
          bed_count?: number
          created_at?: string
          expected_rent?: number | null
          floor?: string | null
          furnishing?: string | null
          id?: string
          last_confirmed_at?: string | null
          min_acceptable_rent?: number | null
          notes?: string | null
          property_id?: string
          rent_per_bed?: number | null
          room_code?: string | null
          room_number?: string
          room_type?: string | null
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
          vacating_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      soft_locks: {
        Row: {
          bed_id: string | null
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          lead_id: string | null
          lock_type: Database["public"]["Enums"]["lock_type"]
          locked_at: string
          locked_by: string | null
          notes: string | null
          room_id: string
        }
        Insert: {
          bed_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          lead_id?: string | null
          lock_type: Database["public"]["Enums"]["lock_type"]
          locked_at?: string
          locked_by?: string | null
          notes?: string | null
          room_id: string
        }
        Update: {
          bed_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          lead_id?: string | null
          lock_type?: Database["public"]["Enums"]["lock_type"]
          locked_at?: string
          locked_by?: string | null
          notes?: string | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "soft_locks_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soft_locks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soft_locks_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soft_locks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      team_queues: {
        Row: {
          created_at: string
          dispatch_rule: string
          id: string
          is_active: boolean
          last_assigned_idx: number
          member_ids: string[]
          owner_agent_id: string | null
          team_name: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          dispatch_rule?: string
          id?: string
          is_active?: boolean
          last_assigned_idx?: number
          member_ids?: string[]
          owner_agent_id?: string | null
          team_name: string
          zone_id: string
        }
        Update: {
          created_at?: string
          dispatch_rule?: string
          id?: string
          is_active?: boolean
          last_assigned_idx?: number
          member_ids?: string[]
          owner_agent_id?: string | null
          team_name?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_queues_owner_agent_id_fkey"
            columns: ["owner_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_queues_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          assigned_staff_id: string | null
          bed_id: string | null
          confirmed: boolean
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          outcome: Database["public"]["Enums"]["visit_outcome"] | null
          property_id: string
          room_id: string | null
          scheduled_at: string
          updated_at: string
        }
        Insert: {
          assigned_staff_id?: string | null
          bed_id?: string | null
          confirmed?: boolean
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["visit_outcome"] | null
          property_id: string
          room_id?: string | null
          scheduled_at: string
          updated_at?: string
        }
        Update: {
          assigned_staff_id?: string | null
          bed_id?: string | null
          confirmed?: boolean
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["visit_outcome"] | null
          property_id?: string
          room_id?: string | null
          scheduled_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          areas: string[]
          city: string
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
        }
        Insert: {
          areas?: string[]
          city?: string
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
        }
        Update: {
          areas?: string[]
          city?: string
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_lock_stale_rooms: { Args: never; Returns: undefined }
      calculate_lead_score: { Args: { p_lead_id: string }; Returns: number }
      confirm_reservation: {
        Args: { p_payment_reference: string; p_reservation_id: string }
        Returns: Json
      }
      create_overdue_notifications: { Args: never; Returns: undefined }
      create_reservation_lock: {
        Args: {
          p_bed_id: string
          p_customer_email?: string
          p_customer_name: string
          p_customer_phone: string
          p_monthly_rent?: number
          p_move_in_date?: string
          p_property_id: string
          p_room_id: string
          p_room_type?: string
        }
        Returns: Json
      }
      get_property_effort: { Args: { p_property_id: string }; Returns: Json }
      match_beds_for_lead: {
        Args: { p_budget: number; p_location: string; p_room_type?: string }
        Returns: {
          bed_id: string
          bed_number: string
          match_score: number
          property_area: string
          property_id: string
          property_name: string
          rent_per_bed: number
          room_id: string
          room_number: string
          room_type: string
        }[]
      }
      recalculate_all_lead_scores: { Args: never; Returns: undefined }
      route_lead_to_zone: {
        Args: { p_location: string }
        Returns: {
          assigned_agent_id: string
          queue_id: string
          zone_id: string
          zone_name: string
        }[]
      }
    }
    Enums: {
      bed_status:
        | "vacant"
        | "occupied"
        | "vacating_soon"
        | "blocked"
        | "reserved"
        | "booked"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "checked_in"
        | "checked_out"
      lead_source:
        | "whatsapp"
        | "website"
        | "instagram"
        | "facebook"
        | "phone"
        | "landing_page"
      lock_type:
        | "visit_scheduled"
        | "pre_booking"
        | "virtual_tour"
        | "reservation_hold"
      payment_status: "unpaid" | "partial" | "paid"
      pipeline_stage:
        | "new"
        | "contacted"
        | "requirement_collected"
        | "property_suggested"
        | "visit_scheduled"
        | "visit_completed"
        | "booked"
        | "lost"
      room_status: "occupied" | "vacating" | "vacant" | "blocked"
      visit_outcome: "booked" | "considering" | "not_interested"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      bed_status: [
        "vacant",
        "occupied",
        "vacating_soon",
        "blocked",
        "reserved",
        "booked",
      ],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "checked_in",
        "checked_out",
      ],
      lead_source: [
        "whatsapp",
        "website",
        "instagram",
        "facebook",
        "phone",
        "landing_page",
      ],
      lock_type: [
        "visit_scheduled",
        "pre_booking",
        "virtual_tour",
        "reservation_hold",
      ],
      payment_status: ["unpaid", "partial", "paid"],
      pipeline_stage: [
        "new",
        "contacted",
        "requirement_collected",
        "property_suggested",
        "visit_scheduled",
        "visit_completed",
        "booked",
        "lost",
      ],
      room_status: ["occupied", "vacating", "vacant", "blocked"],
      visit_outcome: ["booked", "considering", "not_interested"],
    },
  },
} as const
