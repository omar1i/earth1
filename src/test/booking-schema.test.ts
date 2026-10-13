import { describe, expect, it } from 'vitest';
import { experiences, groupTrips, privateDestinations } from '@/lib/content';
import { bookingSchema, muscatToday } from '@/lib/booking-schema';
const input={submission_key:'55c1ad41-1b0e-4b1c-a513-7246ad52f3fb',experience_id:'sea-fishing',customer_name:'Test Visitor',contact_number:'+96800000000',email:'',preferred_date:muscatToday(),participant_count:2,preferred_language:'en',terms_accepted:true};
describe('Booking inquiry validation',()=>{
 it('accepts a valid inquiry',()=>expect(bookingSchema.safeParse(input).success).toBe(true));
 it.each([0,-1,1.5,201])('rejects participant count %s',count=>expect(bookingSchema.safeParse({...input,participant_count:count}).success).toBe(false));
 it('rejects past dates',()=>expect(bookingSchema.safeParse({...input,preferred_date:'2000-01-01'}).success).toBe(false));
 it('rejects impossible dates',()=>expect(bookingSchema.safeParse({...input,preferred_date:'2030-02-30'}).success).toBe(false));
 it('rejects unknown experiences',()=>expect(bookingSchema.safeParse({...input,experience_id:'snorkeling'}).success).toBe(false));
 it('requires country code',()=>expect(bookingSchema.safeParse({...input,contact_number:'91915594'}).success).toBe(false));
 it('rejects invalid email',()=>expect(bookingSchema.safeParse({...input,email:'invalid'}).success).toBe(false));
 it('requires the terms to be accepted',()=>{expect(bookingSchema.safeParse({...input,terms_accepted:false}).success).toBe(false);const {terms_accepted:_omit,...without}=input;void _omit;expect(bookingSchema.safeParse(without).success).toBe(false)});
 it('rejects submissions that fill the hidden honeypot field',()=>expect(bookingSchema.safeParse({...input,company_url:'http://spam.example'}).success).toBe(false));
 it('accepts an empty honeypot field',()=>expect(bookingSchema.safeParse({...input,company_url:''}).success).toBe(true));
 it('accepts every trip listed in content.ts (keeps the booking list and the trip list in sync)',()=>{for(const e of [...experiences,...privateDestinations])expect(bookingSchema.safeParse({...input,experience_id:e.id}).success,e.id).toBe(true)});
 it('group trips: accept only the trip\'s own date',()=>{for(const g of groupTrips){expect(bookingSchema.safeParse({...input,experience_id:g.id,preferred_date:'2099-01-01'}).success,g.id+' wrong date').toBe(false);if(g.startDate>=muscatToday())expect(bookingSchema.safeParse({...input,experience_id:g.id,preferred_date:g.startDate}).success,g.id).toBe(true)}});
});
