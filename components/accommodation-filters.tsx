"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter, Bed, Home, Users, Wifi, CheckCircle, MapPin, KeyRound, ParkingCircle, Utensils, WashingMachine, ShieldCheck, X, Sparkles } from "lucide-react"
import { useState } from "react"

// Filter config for DRYness
const ROOM_TYPES = [
  { id: "single", label: "Single Room", icon: Bed },
  { id: "shared", label: "Shared Room", icon: Users },
  { id: "studio", label: "Studio Apartment", icon: Home },
  { id: "apartment", label: "Full Apartment", icon: KeyRound },
]
const AMENITIES = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "furnished", label: "Furnished", icon: Home },
  { id: "utilities", label: "Utilities Included", icon: Sparkles },
  { id: "kitchen", label: "Kitchen", icon: Utensils },
  { id: "laundry", label: "Laundry", icon: WashingMachine },
  { id: "parking", label: "Parking", icon: ParkingCircle },
]
const LOCATIONS = [
  { id: "main-campus", label: "Main Campus", icon: MapPin },
  { id: "north-campus", label: "North Campus", icon: MapPin },
  { id: "south-campus", label: "South Campus", icon: MapPin },
  { id: "city-center", label: "City Center", icon: MapPin },
]

export type AccommodationFilterState = {
  price: [number, number]
  types: string[]
  amenities: string[]
  locations: string[]
  verifiedOnly: boolean
}

export interface AccommodationFiltersProps {
  value: AccommodationFilterState
  onChange: (next: AccommodationFilterState) => void
  onReset?: () => void
  mobileSheet?: boolean
  showActions?: boolean
  onApply?: () => void
  onCancel?: () => void
}

export function AccommodationFiltersTrigger({ onClick, badgeCount }: { onClick?: () => void; badgeCount?: number }) {
  return (
    <Button variant="outline" className="flex items-center gap-2 h-12" onClick={e => { console.log("Filters button clicked"); onClick?.(); }} type="button">
      <Filter className="h-4 w-4" /> Filters
      {badgeCount ? <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">{badgeCount}</span> : null}
    </Button>
  )
}

export function AccommodationFilterForm({ value, onChange, onReset, showActions, onApply, onCancel }: AccommodationFiltersProps) {
  // Helper to update a field
  const setField = (field: keyof AccommodationFilterState, val: any) => {
    onChange({ ...value, [field]: val })
  }
  const toggleMulti = (field: keyof AccommodationFilterState, id: string) => {
    const arr = value[field] as string[]
    setField(field, arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id])
  }
  const toggleBool = (field: keyof AccommodationFilterState) => {
    setField(field, !value[field])
  }
  const handleReset = () => {
    onReset?.()
  }
  const activeBadges = [
    ...value.types.map((id) => {
      const t = ROOM_TYPES.find((t) => t.id === id)
      return t ? { label: t.label, icon: t.icon } : undefined
    }),
    ...value.amenities.map((id) => {
      const a = AMENITIES.find((a) => a.id === id)
      return a ? { label: a.label, icon: a.icon } : undefined
    }),
    ...value.locations.map((id) => {
      const l = LOCATIONS.find((l) => l.id === id)
      return l ? { label: l.label, icon: l.icon } : undefined
    }),
    value.verifiedOnly ? { label: "Verified Only", icon: ShieldCheck } : undefined,
    (value.price[0] > 0 || value.price[1] < 1000) ? { label: `$${value.price[0]}-${value.price[1]}`, icon: Filter } : undefined,
  ].filter((b): b is { label: string; icon: any } => !!b)

  return (
    <div className="space-y-4">
      {activeBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {activeBadges.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <b.icon className="h-3 w-3 mr-1" /> {b.label}
            </span>
          ))}
          <Button size="icon" variant="ghost" className="ml-2" onClick={handleReset}><X className="h-4 w-4" /></Button>
        </div>
      )}
      <Accordion type="multiple" defaultValue={["price", "type", "amenities"]}>
        <AccordionItem value="price">
          <AccordionTrigger>Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <Slider min={0} max={1000} step={10} value={value.price} onValueChange={(v) => setField("price", v as [number, number])} />
              <div className="flex items-center justify-between">
                <span className="text-sm">${value.price[0]}</span>
                <span className="text-sm">${value.price[1]}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="type">
          <AccordionTrigger>Room Type</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {ROOM_TYPES.map((t) => (
                <div className="flex items-center space-x-2" key={t.id}>
                  <Checkbox id={t.id} checked={value.types.includes(t.id)} onCheckedChange={() => toggleMulti("types", t.id)} />
                  <label htmlFor={t.id} className="text-sm font-medium flex items-center gap-1">
                    <t.icon className="h-4 w-4 mr-1" /> {t.label}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="amenities">
          <AccordionTrigger>Amenities</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {AMENITIES.map((a) => (
                <div className="flex items-center space-x-2" key={a.id}>
                  <Checkbox id={a.id} checked={value.amenities.includes(a.id)} onCheckedChange={() => toggleMulti("amenities", a.id)} />
                  <label htmlFor={a.id} className="text-sm font-medium flex items-center gap-1">
                    <a.icon className="h-4 w-4 mr-1" /> {a.label}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="location">
          <AccordionTrigger>Location</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {LOCATIONS.map((l) => (
                <div className="flex items-center space-x-2" key={l.id}>
                  <Checkbox id={l.id} checked={value.locations.includes(l.id)} onCheckedChange={() => toggleMulti("locations", l.id)} />
                  <label htmlFor={l.id} className="text-sm font-medium flex items-center gap-1">
                    <l.icon className="h-4 w-4 mr-1" /> {l.label}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="verification">
          <AccordionTrigger>Verification</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="verified-only" checked={value.verifiedOnly} onCheckedChange={() => toggleBool("verifiedOnly")} />
                <label htmlFor="verified-only" className="text-sm font-medium flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 mr-1" /> Verified Listings Only
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {showActions && (
        <div className="flex gap-2 mt-4">
          <Button onClick={onApply} className="w-full">Apply Filters</Button>
          <Button variant="outline" onClick={onCancel} className="w-full">Cancel</Button>
        </div>
      )}
    </div>
  )
}

export default function AccommodationFilters({ value, onChange, onReset, mobileSheet, showActions, onApply, onCancel }: AccommodationFiltersProps) {
  // Helper to update a field
  const setField = (field: keyof AccommodationFilterState, val: any) => {
    onChange({ ...value, [field]: val })
  }
  // Helper for multi-select
  const toggleMulti = (field: keyof AccommodationFilterState, id: string) => {
    const arr = value[field] as string[]
    setField(field, arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id])
  }
  // Helper for single boolean
  const toggleBool = (field: keyof AccommodationFilterState) => {
    setField(field, !value[field])
  }
  // Clear all
  const handleReset = () => {
    onReset?.()
  }
  // Filter summary badges
  const activeBadges = [
    ...value.types.map((id) => {
      const t = ROOM_TYPES.find((t) => t.id === id)
      return t ? { label: t.label, icon: t.icon } : undefined
    }),
    ...value.amenities.map((id) => {
      const a = AMENITIES.find((a) => a.id === id)
      return a ? { label: a.label, icon: a.icon } : undefined
    }),
    ...value.locations.map((id) => {
      const l = LOCATIONS.find((l) => l.id === id)
      return l ? { label: l.label, icon: l.icon } : undefined
    }),
    value.verifiedOnly ? { label: "Verified Only", icon: ShieldCheck } : undefined,
    (value.price[0] > 0 || value.price[1] < 1000) ? { label: `$${value.price[0]}-${value.price[1]}`, icon: Filter } : undefined,
  ].filter((b): b is { label: string; icon: any } => !!b)

  // Main filter UI
  const filterContent = (
    <div className="space-y-4">
      {activeBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {activeBadges.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <b.icon className="h-3 w-3 mr-1" /> {b.label}
            </span>
          ))}
          <Button size="icon" variant="ghost" className="ml-2" onClick={handleReset}><X className="h-4 w-4" /></Button>
        </div>
      )}
      <Accordion type="multiple" defaultValue={["price", "type", "amenities"]}>
        <AccordionItem value="price">
          <AccordionTrigger>Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <Slider min={0} max={1000} step={10} value={value.price} onValueChange={(v) => setField("price", v as [number, number])} />
              <div className="flex items-center justify-between">
                <span className="text-sm">${value.price[0]}</span>
                <span className="text-sm">${value.price[1]}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="type">
          <AccordionTrigger>Room Type</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {ROOM_TYPES.map((t) => (
                <div className="flex items-center space-x-2" key={t.id}>
                  <Checkbox id={t.id} checked={value.types.includes(t.id)} onCheckedChange={() => toggleMulti("types", t.id)} />
                  <label htmlFor={t.id} className="text-sm font-medium flex items-center gap-1">
                    <t.icon className="h-4 w-4 mr-1" /> {t.label}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="amenities">
          <AccordionTrigger>Amenities</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {AMENITIES.map((a) => (
                <div className="flex items-center space-x-2" key={a.id}>
                  <Checkbox id={a.id} checked={value.amenities.includes(a.id)} onCheckedChange={() => toggleMulti("amenities", a.id)} />
                  <label htmlFor={a.id} className="text-sm font-medium flex items-center gap-1">
                    <a.icon className="h-4 w-4 mr-1" /> {a.label}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="location">
          <AccordionTrigger>Location</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {LOCATIONS.map((l) => (
                <div className="flex items-center space-x-2" key={l.id}>
                  <Checkbox id={l.id} checked={value.locations.includes(l.id)} onCheckedChange={() => toggleMulti("locations", l.id)} />
                  <label htmlFor={l.id} className="text-sm font-medium flex items-center gap-1">
                    <l.icon className="h-4 w-4 mr-1" /> {l.label}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="verification">
          <AccordionTrigger>Verification</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="verified-only" checked={value.verifiedOnly} onCheckedChange={() => toggleBool("verifiedOnly")} />
                <label htmlFor="verified-only" className="text-sm font-medium flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 mr-1" /> Verified Listings Only
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div className="pt-2 space-y-2">
        <Button className="w-full" onClick={() => {}} disabled>
          Apply Filters
        </Button>
        <Button variant="outline" className="w-full" onClick={handleReset}>
          Reset
        </Button>
      </div>
      {showActions && (
        <div className="flex gap-2 mt-4">
          <Button onClick={onApply} className="w-full">Apply Filters</Button>
          <Button variant="outline" onClick={onCancel} className="w-full">Cancel</Button>
        </div>
      )}
    </div>
  )

  // Mobile: show in bottom sheet
  if (mobileSheet) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <AccommodationFiltersTrigger badgeCount={activeBadges.length} />
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto max-h-screen overflow-y-visible rounded-t-xl">
          <div className="p-2">{filterContent}</div>
        </SheetContent>
      </Sheet>
    )
  }
  // Desktop: show in popover
  return (
    <Popover>
      <PopoverTrigger asChild>
        <AccommodationFiltersTrigger badgeCount={activeBadges.length} />
      </PopoverTrigger>
      <PopoverContent className="w-96 max-w-full p-4" align="start">
        {filterContent}
      </PopoverContent>
    </Popover>
  )
}
