import { describe, expect, it } from "vitest";
import { seatStatus } from "@/lib/catalog";
import type { Schedule } from "@/lib/content";

const sch = (o: Partial<Schedule>): Schedule => ({
  id: 1, date: "2030-01-01", time: null, label: { en: "x", ar: "x" },
  capacity: 14, seatsLeft: 14, bookable: true, soldOut: false, ...o,
});

describe("seatStatus (group trip card label)", () => {
  it("shows nothing when the trip has no departures", () => {
    expect(seatStatus(undefined)).toBeNull();
    expect(seatStatus([])).toBeNull();
  });
  it("shows seats left for the next bookable departure", () => {
    expect(seatStatus([sch({ seatsLeft: 9 })])).toEqual({ tone: "ok", left: 9 });
  });
  it("flags the last few seats", () => {
    expect(seatStatus([sch({ seatsLeft: 3 })])).toEqual({ tone: "low", left: 3 });
    expect(seatStatus([sch({ seatsLeft: 1 })])).toEqual({ tone: "low", left: 1 });
  });
  it("uses the first bookable departure, skipping full ones before it", () => {
    const list = [sch({ id: 1, bookable: false, soldOut: true, seatsLeft: 0 }), sch({ id: 2, seatsLeft: 6 })];
    expect(seatStatus(list)).toEqual({ tone: "ok", left: 6 });
  });
  it("says full when every departure is sold out", () => {
    expect(seatStatus([sch({ bookable: false, soldOut: true, seatsLeft: 0 })])).toEqual({ tone: "full", left: 0 });
  });
  it("says closed when nothing is open but seats remain (closed or past departure)", () => {
    expect(seatStatus([sch({ bookable: false, soldOut: false, seatsLeft: 5 })])).toEqual({ tone: "closed", left: 0 });
  });
});
