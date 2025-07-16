import { useState } from "react";

export function FilterBar({ onFilter }: { onFilter?: (filters: { startDate?: string, endDate?: string, category?: string }) => void }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");

  return (
    <div className="flex flex-wrap gap-4 items-end mb-8">
      <div>
        <label className="block text-xs mb-1">Start Date</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs mb-1">End Date</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs mb-1">Category</label>
        <select value={category} onChange={e => setCategory(e.target.value)} className="border rounded px-2 py-1">
          <option value="">All</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="services">Services</option>
          {/* Add more categories as needed */}
        </select>
      </div>
      <button
        className="bg-primary text-white px-4 py-2 rounded"
        onClick={() => onFilter?.({ startDate, endDate, category })}
      >
        Apply Filters
      </button>
    </div>
  );
} 