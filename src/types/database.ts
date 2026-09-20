export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      colleges: {
        Row: {
          id: string
          name: string
          code: string
          logo_url: string | null
          email: string | null
          phone: string | null
          website: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          affiliation: string | null
          accreditation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          logo_url?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          affiliation?: string | null
          accreditation?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          logo_url?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          affiliation?: string | null
          accreditation?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          college_id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          college_id: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          college_id: string
          name: string
          code: string
          hod_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          college_id: string
          name: string
          code: string
          hod_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          name?: string
          code?: string
          hod_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          department_id: string
          name: string
          code: string
          duration_years: number
          degree_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          department_id: string
          name: string
          code: string
          duration_years: number
          degree_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          department_id?: string
          name?: string
          code?: string
          duration_years?: number
          degree_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      academic_years: {
        Row: {
          id: string
          college_id: string
          name: string
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          college_id: string
          name: string
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          name?: string
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      semesters: {
        Row: {
          id: string
          course_id: string
          semester_number: number
          name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          semester_number: number
          name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          semester_number?: number
          name?: string | null
          created_at?: string
        }
      }
      fee_structures: {
        Row: {
          id: string
          college_id: string
          academic_year_id: string
          semester_id: string | null
          course_id: string
          category: string
          student_category: string | null
          amount: number
          due_date: string | null
          late_fee_per_day: number
          late_fee_max: number
          grace_days: number
          created_at: string
        }
        Insert: {
          id?: string
          college_id: string
          academic_year_id: string
          semester_id?: string | null
          course_id: string
          category: string
          student_category?: string | null
          amount: number
          due_date?: string | null
          late_fee_per_day?: number
          late_fee_max?: number
          grace_days?: number
          created_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          academic_year_id?: string
          semester_id?: string | null
          course_id?: string
          category?: string
          student_category?: string | null
          amount?: number
          due_date?: string | null
          late_fee_per_day?: number
          late_fee_max?: number
          grace_days?: number
          created_at?: string
        }
      }
      refunds: {
        Row: {
          id: string
          payment_id: string
          amount: number
          reason: string | null
          processed_by: string | null
          college_id: string
          refund_method: string
          reference_number: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          payment_id: string
          amount: number
          reason?: string | null
          processed_by?: string | null
          college_id: string
          refund_method?: string
          reference_number?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          payment_id?: string
          amount?: number
          reason?: string | null
          processed_by?: string | null
          college_id?: string
          refund_method?: string
          reference_number?: string | null
          status?: string
          created_at?: string
        }
      }
      student_fees: {
        Row: {
          id: string
          college_id: string
          student_id: string
          fee_structure_id: string
          amount_due: number
          paid_amount: number
          scholarship_amount: number
          discount_amount: number
          late_fee_amount: number
          status: string
          remarks: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          college_id: string
          student_id: string
          fee_structure_id: string
          amount_due: number
          paid_amount?: number
          scholarship_amount?: number
          discount_amount?: number
          late_fee_amount?: number
          status?: string
          remarks?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          student_id?: string
          fee_structure_id?: string
          amount_due?: number
          paid_amount?: number
          scholarship_amount?: number
          discount_amount?: number
          late_fee_amount?: number
          status?: string
          remarks?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          college_id: string
          student_fee_id: string
          student_id: string
          amount: number
          payment_method: string
          reference_number: string | null
          payment_date: string
          status: string
          gateway_metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          college_id: string
          student_fee_id: string
          student_id: string
          amount: number
          payment_method: string
          reference_number?: string | null
          payment_date?: string
          status?: string
          gateway_metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          student_fee_id?: string
          student_id?: string
          amount?: number
          payment_method?: string
          reference_number?: string | null
          payment_date?: string
          status?: string
          gateway_metadata?: Json | null
          created_at?: string
        }
      }
      sections: {
        Row: {
          id: string
          semester_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          semester_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          semester_id?: string
          name?: string
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          college_id: string
          admission_number: string
          dob: string | null
          gender: string | null
          address: string | null
          parent_info: Json | null
          department_id: string | null
          course_id: string | null
          semester_id: string | null
          section_id: string | null
          academic_year_id: string | null
          admission_date: string | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          college_id: string
          admission_number: string
          dob?: string | null
          gender?: string | null
          address?: string | null
          parent_info?: Json | null
          department_id?: string | null
          course_id?: string | null
          semester_id?: string | null
          section_id?: string | null
          academic_year_id?: string | null
          admission_date?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          admission_number?: string
          dob?: string | null
          gender?: string | null
          address?: string | null
          parent_info?: Json | null
          department_id?: string | null
          course_id?: string | null
          semester_id?: string | null
          section_id?: string | null
          academic_year_id?: string | null
          admission_date?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      student_documents: {
        Row: {
          id: string
          student_id: string
          college_id: string
          document_type: string
          title: string
          file_path: string
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          college_id: string
          document_type: string
          title: string
          file_path: string
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          college_id?: string
          document_type?: string
          title?: string
          file_path?: string
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          semester_id: string
          name: string
          code: string
          credits: number
          type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          semester_id: string
          name: string
          code: string
          credits?: number
          type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          semester_id?: string
          name?: string
          code?: string
          credits?: number
          type?: string
          created_at?: string
          updated_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          college_id: string
          room_number: string
          building: string | null
          capacity: number
          room_type: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          college_id: string
          room_number: string
          building?: string | null
          capacity?: number
          room_type?: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          room_number?: string
          building?: string | null
          capacity?: number
          room_type?: string
          status?: string
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity: string
          entity_id: string
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity: string
          entity_id: string
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity?: string
          entity_id?: string
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }

      faculty: {
        Row: {
          id: string
          college_id: string
          department_id: string | null
          employee_id: string
          designation: string
          qualification: string | null
          joining_date: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          college_id: string
          department_id?: string | null
          employee_id: string
          designation: string
          qualification?: string | null
          joining_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          department_id?: string | null
          employee_id?: string
          designation?: string
          qualification?: string | null
          joining_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      faculty_assignments: {
        Row: {
          id: string
          college_id: string
          faculty_id: string
          subject_id: string
          section_id: string
          semester_id: string
          academic_year_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          college_id: string
          faculty_id: string
          subject_id: string
          section_id: string
          semester_id: string
          academic_year_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          faculty_id?: string
          subject_id?: string
          section_id?: string
          semester_id?: string
          academic_year_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      faculty_documents: {
        Row: {
          id: string
          faculty_id: string
          college_id: string
          document_type: string
          title: string
          file_path: string
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          faculty_id: string
          college_id: string
          document_type: string
          title: string
          file_path: string
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          faculty_id?: string
          college_id?: string
          document_type?: string
          title?: string
          file_path?: string
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      attendance_sessions: {
        Row: {
          id: string
          college_id: string
          faculty_id: string
          subject_id: string
          section_id: string
          semester_id: string
          academic_year_id: string
          date: string
          start_time: string
          end_time: string
          qr_token: string | null
          qr_expires_at: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          college_id: string
          faculty_id: string
          subject_id: string
          section_id: string
          semester_id: string
          academic_year_id: string
          date: string
          start_time: string
          end_time: string
          qr_token?: string | null
          qr_expires_at?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          faculty_id?: string
          subject_id?: string
          section_id?: string
          semester_id?: string
          academic_year_id?: string
          date?: string
          start_time?: string
          end_time?: string
          qr_token?: string | null
          qr_expires_at?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      attendance_records: {
        Row: {
          id: string
          session_id: string
          student_id: string
          college_id: string
          status: string
          remarks: string | null
          recorded_via: string
          recorded_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          student_id: string
          college_id: string
          status: string
          remarks?: string | null
          recorded_via?: string
          recorded_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          student_id?: string
          college_id?: string
          status?: string
          remarks?: string | null
          recorded_via?: string
          recorded_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      timetable_slots: {
        Row: {
          id: string
          college_id: string
          academic_year_id: string
          semester_id: string
          section_id: string
          subject_id: string
          faculty_id: string
          room_id: string
          day_of_week: string
          start_time: string
          end_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          college_id: string
          academic_year_id: string
          semester_id: string
          section_id: string
          subject_id: string
          faculty_id: string
          room_id: string
          day_of_week: string
          start_time: string
          end_time: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          academic_year_id?: string
          semester_id?: string
          section_id?: string
          subject_id?: string
          faculty_id?: string
          room_id?: string
          day_of_week?: string
          start_time?: string
          end_time?: string
          created_at?: string
          updated_at?: string
        }
      }
      grading_rules: {
        Row: {
          id: string
          college_id: string
          grade: string
          grade_point: number
          min_percentage: number
          max_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          college_id: string
          grade: string
          grade_point: number
          min_percentage: number
          max_percentage: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          grade?: string
          grade_point?: number
          min_percentage?: number
          max_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          college_id: string
          academic_year_id: string
          semester_id: string
          name: string
          type: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          college_id: string
          academic_year_id: string
          semester_id: string
          name: string
          type: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          academic_year_id?: string
          semester_id?: string
          name?: string
          type?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      exam_subjects: {
        Row: {
          id: string
          exam_id: string
          subject_id: string
          date: string
          start_time: string
          end_time: string
          max_marks: number
          min_pass_marks: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          subject_id: string
          date: string
          start_time: string
          end_time: string
          max_marks: number
          min_pass_marks: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          subject_id?: string
          date?: string
          start_time?: string
          end_time?: string
          max_marks?: number
          min_pass_marks?: number
          created_at?: string
          updated_at?: string
        }
      }
      exam_marks: {
        Row: {
          id: string
          exam_id: string
          subject_id: string
          student_id: string
          faculty_id: string
          college_id: string
          marks_obtained: number
          status: string
          remarks: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          subject_id: string
          student_id: string
          faculty_id: string
          college_id: string
          marks_obtained: number
          status?: string
          remarks?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          subject_id?: string
          student_id?: string
          faculty_id?: string
          college_id?: string
          marks_obtained?: number
          status?: string
          remarks?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      books: {
        Row: {
          id: string
          college_id: string
          title: string
          author: string | null
          isbn: string | null
          publisher: string | null
          category: string | null
          edition: string | null
          total_copies: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          college_id: string
          title: string
          author?: string | null
          isbn?: string | null
          publisher?: string | null
          category?: string | null
          edition?: string | null
          total_copies?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          title?: string
          author?: string | null
          isbn?: string | null
          publisher?: string | null
          category?: string | null
          edition?: string | null
          total_copies?: number
          created_at?: string
          updated_at?: string
        }
      }
      book_copies: {
        Row: {
          id: string
          book_id: string
          accession_number: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          accession_number: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          accession_number?: string
          status?: string
          created_at?: string
        }
      }
      library_members: {
        Row: {
          id: string
          college_id: string
          user_id: string
          member_type: string
          max_books: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          college_id: string
          user_id: string
          member_type: string
          max_books?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          user_id?: string
          member_type?: string
          max_books?: number
          status?: string
          created_at?: string
        }
      }
      library_transactions: {
        Row: {
          id: string
          college_id: string
          member_id: string
          copy_id: string
          issue_date: string
          due_date: string
          return_date: string | null
          renewal_count: number
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          college_id?: string
          member_id: string
          copy_id: string
          issue_date?: string
          due_date: string
          return_date?: string | null
          renewal_count?: number
          status?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          member_id?: string
          copy_id?: string
          issue_date?: string
          due_date?: string
          return_date?: string | null
          renewal_count?: number
          status?: string
          notes?: string | null
          created_at?: string
        }
      }
      library_fines: {
        Row: {
          id: string
          college_id: string | null
          transaction_id: string
          amount: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          college_id?: string | null
          transaction_id: string
          amount: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          college_id?: string | null
          transaction_id?: string
          amount?: number
          status?: string
          created_at?: string
        }
      }
      book_reservations: {
        Row: {
          id: string
          college_id: string
          book_id: string
          member_id: string
          reserved_at: string
          expires_at: string
          status: string
        }
        Insert: {
          id?: string
          college_id: string
          book_id: string
          member_id: string
          reserved_at?: string
          expires_at: string
          status?: string
        }
        Update: {
          id?: string
          college_id?: string
          book_id?: string
          member_id?: string
          reserved_at?: string
          expires_at?: string
          status?: string
        }
      }
      library_fine_rules: {
        Row: {
          id: string
          college_id: string
          fine_per_day: number
          max_fine: number | null
          grace_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          college_id: string
          fine_per_day?: number
          max_fine?: number | null
          grace_days?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          fine_per_day?: number
          max_fine?: number | null
          grace_days?: number
          created_at?: string
          updated_at?: string
        }
      }
      hostels: {
        Row: {
          id: string
          college_id: string
          name: string
          type: string
          warden_id: string | null
          description: string | null
          total_floors: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          college_id: string
          name: string
          type: string
          warden_id?: string | null
          description?: string | null
          total_floors?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          name?: string
          type?: string
          warden_id?: string | null
          description?: string | null
          total_floors?: number
          created_at?: string
          updated_at?: string
        }
      }
      hostel_blocks: {
        Row: {
          id: string
          hostel_id: string
          name: string
          floor_number: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          hostel_id: string
          name: string
          floor_number?: number
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          hostel_id?: string
          name?: string
          floor_number?: number
          description?: string | null
          created_at?: string
        }
      }
      hostel_rooms: {
        Row: {
          id: string
          block_id: string
          room_number: string
          capacity: number
          room_type: string
          has_ac: boolean
          has_attached_bath: boolean
          monthly_rent: number
          created_at: string
        }
        Insert: {
          id?: string
          block_id: string
          room_number: string
          capacity?: number
          room_type?: string
          has_ac?: boolean
          has_attached_bath?: boolean
          monthly_rent?: number
          created_at?: string
        }
        Update: {
          id?: string
          block_id?: string
          room_number?: string
          capacity?: number
          room_type?: string
          has_ac?: boolean
          has_attached_bath?: boolean
          monthly_rent?: number
          created_at?: string
        }
      }
      hostel_beds: {
        Row: {
          id: string
          room_id: string
          bed_number: string
          status: string
        }
        Insert: {
          id?: string
          room_id: string
          bed_number: string
          status?: string
        }
        Update: {
          id?: string
          room_id?: string
          bed_number?: string
          status?: string
        }
      }
      hostel_allocations: {
        Row: {
          id: string
          bed_id: string
          student_id: string
          academic_year_id: string
          allocation_date: string
          vacation_date: string | null
          status: string
          college_id: string | null
          notes: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bed_id: string
          student_id: string
          academic_year_id: string
          allocation_date?: string
          vacation_date?: string | null
          status?: string
          college_id?: string | null
          notes?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bed_id?: string
          student_id?: string
          academic_year_id?: string
          allocation_date?: string
          vacation_date?: string | null
          status?: string
          college_id?: string | null
          notes?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hostel_complaints: {
        Row: {
          id: string
          college_id: string
          hostel_id: string
          student_id: string
          category: string
          title: string
          description: string
          status: string
          assigned_to: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          college_id: string
          hostel_id: string
          student_id: string
          category: string
          title: string
          description: string
          status?: string
          assigned_to?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          hostel_id?: string
          student_id?: string
          category?: string
          title?: string
          description?: string
          status?: string
          assigned_to?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hostel_visitors: {
        Row: {
          id: string
          college_id: string
          hostel_id: string
          student_id: string
          visitor_name: string
          visitor_phone: string | null
          relation: string | null
          purpose: string | null
          check_in_time: string
          check_out_time: string | null
          approved_by: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          college_id: string
          hostel_id: string
          student_id: string
          visitor_name: string
          visitor_phone?: string | null
          relation?: string | null
          purpose?: string | null
          check_in_time?: string
          check_out_time?: string | null
          approved_by?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          hostel_id?: string
          student_id?: string
          visitor_name?: string
          visitor_phone?: string | null
          relation?: string | null
          purpose?: string | null
          check_in_time?: string
          check_out_time?: string | null
          approved_by?: string | null
          status?: string
          created_at?: string
        }
      }
      buses: {
        Row: {
          id: string
          college_id: string
          registration_number: string
          capacity: number
          model: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          college_id: string
          registration_number: string
          capacity: number
          model?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          registration_number?: string
          capacity?: number
          model?: string | null
          status?: string
          created_at?: string
        }
      }
      drivers: {
        Row: {
          id: string
          college_id: string
          name: string
          license_number: string
          phone: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          college_id: string
          name: string
          license_number: string
          phone?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          name?: string
          license_number?: string
          phone?: string | null
          status?: string
          created_at?: string
        }
      }
      routes: {
        Row: {
          id: string
          college_id: string
          bus_id: string | null
          driver_id: string | null
          name: string
          start_point: string | null
          end_point: string | null
          created_at: string
        }
        Insert: {
          id?: string
          college_id: string
          bus_id?: string | null
          driver_id?: string | null
          name: string
          start_point?: string | null
          end_point?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          bus_id?: string | null
          driver_id?: string | null
          name?: string
          start_point?: string | null
          end_point?: string | null
          created_at?: string
        }
      }
      bus_stops: {
        Row: {
          id: string
          route_id: string
          name: string
          pickup_time: string
          drop_time: string
          stop_order: number
          created_at: string
        }
        Insert: {
          id?: string
          route_id: string
          name: string
          pickup_time: string
          drop_time: string
          stop_order: number
          created_at?: string
        }
        Update: {
          id?: string
          route_id?: string
          name?: string
          pickup_time?: string
          drop_time?: string
          stop_order?: number
          created_at?: string
        }
      }
      transport_assignments: {
        Row: {
          id: string
          student_id: string
          route_id: string
          stop_id: string
          academic_year_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          route_id: string
          stop_id: string
          academic_year_id: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          route_id?: string
          stop_id?: string
          academic_year_id?: string
          status?: string
          created_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          faculty_id: string
          subject_id: string
          section_id: string
          title: string
          description: string | null
          deadline: string
          attachment_url: string | null
          max_marks: number | null
          status: string
          allow_late_submission: boolean
          college_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          faculty_id: string
          subject_id: string
          section_id: string
          title: string
          description?: string | null
          deadline: string
          attachment_url?: string | null
          max_marks?: number | null
          status?: string
          allow_late_submission?: boolean
          college_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          faculty_id?: string
          subject_id?: string
          section_id?: string
          title?: string
          description?: string | null
          deadline?: string
          attachment_url?: string | null
          max_marks?: number | null
          status?: string
          allow_late_submission?: boolean
          college_id?: string | null
          created_at?: string
        }
      }
      assignment_submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          submission_url: string
          submitted_at: string
          marks_obtained: number | null
          feedback: string | null
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          submission_url: string
          submitted_at?: string
          marks_obtained?: number | null
          feedback?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          submission_url?: string
          submitted_at?: string
          marks_obtained?: number | null
          feedback?: string | null
        }
      }
      notices: {
        Row: {
          id: string
          college_id: string
          title: string
          content: string
          department_id: string | null
          course_id: string | null
          semester_id: string | null
          section_id: string | null
          target_role: string | null
          category: string
          attachment_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          college_id: string
          title: string
          content: string
          department_id?: string | null
          course_id?: string | null
          semester_id?: string | null
          section_id?: string | null
          target_role?: string | null
          category?: string
          attachment_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          title?: string
          content?: string
          department_id?: string | null
          course_id?: string | null
          semester_id?: string | null
          section_id?: string | null
          target_role?: string | null
          category?: string
          attachment_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          is_read: boolean
          link: string | null
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: string
          is_read?: boolean
          link?: string | null
          category?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          link?: string | null
          category?: string
          created_at?: string
        }
      }
      leave_requests: {
        Row: {
          id: string
          requester_id: string
          start_date: string
          end_date: string
          reason: string
          status: string
          approved_by: string | null
          created_at: string
          college_id: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          requester_id: string
          start_date: string
          end_date: string
          reason: string
          status?: string
          approved_by?: string | null
          created_at?: string
          college_id?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          requester_id?: string
          start_date?: string
          end_date?: string
          reason?: string
          status?: string
          approved_by?: string | null
          created_at?: string
          college_id?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
        }
      }
      complaints: {
        Row: {
          id: string
          requester_id: string
          category: string
          title: string
          description: string
          status: string
          assigned_to: string | null
          created_at: string
          updated_at: string
          college_id: string | null
          priority: string
          attachment_url: string | null
          resolution_note: string | null
        }
        Insert: {
          id?: string
          requester_id: string
          category: string
          title: string
          description: string
          status?: string
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          college_id?: string | null
          priority?: string
          attachment_url?: string | null
          resolution_note?: string | null
        }
        Update: {
          id?: string
          requester_id?: string
          category?: string
          title?: string
          description?: string
          status?: string
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          college_id?: string | null
          priority?: string
          attachment_url?: string | null
          resolution_note?: string | null
        }
      }
      support_tickets: {
        Row: {
          id: string
          requester_id: string
          issue_type: string
          title: string
          description: string
          priority: string
          status: string
          assigned_to: string | null
          created_at: string
          updated_at: string
          college_id: string | null
          ticket_number: number | null
          category: string | null
          resolution_note: string | null
        }
        Insert: {
          id?: string
          requester_id: string
          issue_type: string
          title: string
          description: string
          priority?: string
          status?: string
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          college_id?: string | null
          ticket_number?: number | null
          category?: string | null
          resolution_note?: string | null
        }
        Update: {
          id?: string
          requester_id?: string
          issue_type?: string
          title?: string
          description?: string
          priority?: string
          status?: string
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          college_id?: string | null
          ticket_number?: number | null
          category?: string | null
          resolution_note?: string | null
        }
      }
      ticket_activity: {
        Row: {
          id: string
          ticket_id: string
          user_id: string
          action: string
          message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          user_id: string
          action: string
          message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          user_id?: string
          action?: string
          message?: string | null
          created_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          college_id: string
          name: string
          industry: string | null
          website: string | null
          contact_person: string | null
          contact_email: string | null
          created_at: string
          location: string | null
          logo_url: string | null
          description: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          college_id: string
          name: string
          industry?: string | null
          website?: string | null
          contact_person?: string | null
          contact_email?: string | null
          created_at?: string
          location?: string | null
          logo_url?: string | null
          description?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          college_id?: string
          name?: string
          industry?: string | null
          website?: string | null
          contact_person?: string | null
          contact_email?: string | null
          created_at?: string
          location?: string | null
          logo_url?: string | null
          description?: string | null
          updated_at?: string | null
        }
      }
      job_posts: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string | null
          requirements: string | null
          ctc_details: string | null
          deadline: string | null
          status: string
          created_at: string
          location: string | null
          eligibility: string | null
          skills: string | null
          package_amount: number | null
          max_applicants: number | null
          college_id: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description?: string | null
          requirements?: string | null
          ctc_details?: string | null
          deadline?: string | null
          status?: string
          created_at?: string
          location?: string | null
          eligibility?: string | null
          skills?: string | null
          package_amount?: number | null
          max_applicants?: number | null
          college_id?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          description?: string | null
          requirements?: string | null
          ctc_details?: string | null
          deadline?: string | null
          status?: string
          created_at?: string
          location?: string | null
          eligibility?: string | null
          skills?: string | null
          package_amount?: number | null
          max_applicants?: number | null
          college_id?: string | null
          updated_at?: string | null
        }
      }
      placement_applications: {
        Row: {
          id: string
          job_post_id: string
          student_id: string
          resume_url: string | null
          status: string
          applied_at: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          job_post_id: string
          student_id: string
          resume_url?: string | null
          status?: string
          applied_at?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          job_post_id?: string
          student_id?: string
          resume_url?: string | null
          status?: string
          applied_at?: string
          notes?: string | null
          updated_at?: string | null
        }
      }
      placement_results: {
        Row: {
          id: string
          application_id: string
          offered_ctc: string | null
          offer_date: string | null
          status: string
          created_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          application_id: string
          offered_ctc?: string | null
          offer_date?: string | null
          status?: string
          created_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          application_id?: string
          offered_ctc?: string | null
          offer_date?: string | null
          status?: string
          created_at?: string
          notes?: string | null
        }
      }
      events: {
        Row: {
          id: string
          college_id: string
          title: string
          description: string | null
          organizer_id: string | null
          venue: string | null
          start_date: string
          end_date: string
          capacity: number | null
          status: string
          created_at: string
          category: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          college_id: string
          title: string
          description?: string | null
          organizer_id?: string | null
          venue?: string | null
          start_date: string
          end_date: string
          capacity?: number | null
          status?: string
          created_at?: string
          category?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          college_id?: string
          title?: string
          description?: string | null
          organizer_id?: string | null
          venue?: string | null
          start_date?: string
          end_date?: string
          capacity?: number | null
          status?: string
          created_at?: string
          category?: string
          updated_at?: string | null
        }
      }
      event_registrations: {
        Row: {
          id: string
          event_id: string
          student_id: string
          status: string
          registered_at: string
          attended_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          student_id: string
          status?: string
          registered_at?: string
          attended_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          student_id?: string
          status?: string
          registered_at?: string
          attended_at?: string | null
        }
      }
      certificates: {
        Row: {
          id: string
          student_id: string
          certificate_id: string
          certificate_type: string
          issue_date: string
          issuer_id: string | null
          verification_status: string
          metadata: Record<string, unknown> | null
          created_at: string
          college_id: string | null
          template_type: string
          student_name: string | null
          course_name: string | null
          valid_until: string | null
          pdf_url: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          certificate_id: string
          certificate_type: string
          issue_date?: string
          issuer_id?: string | null
          verification_status?: string
          metadata?: Record<string, unknown> | null
          created_at?: string
          college_id?: string | null
          template_type?: string
          student_name?: string | null
          course_name?: string | null
          valid_until?: string | null
          pdf_url?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          certificate_id?: string
          certificate_type?: string
          issue_date?: string
          issuer_id?: string | null
          verification_status?: string
          metadata?: Record<string, unknown> | null
          created_at?: string
          college_id?: string | null
          template_type?: string
          student_name?: string | null
          course_name?: string | null
          valid_until?: string | null
          pdf_url?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
