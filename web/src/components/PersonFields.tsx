import { HOURS, type PersonForm } from "@/lib/gunghap-ui";

export function PersonFields({
  title, value, onChange, timeRequired,
}: {
  title: string;
  value: PersonForm;
  onChange: (v: PersonForm) => void;
  timeRequired?: boolean;
}) {
  return (
    <fieldset className="rounded-2xl border border-[#F0997B]/40 bg-white/50 p-5">
      <legend className="px-2 font-serif text-lg text-[#712B13]">{title}</legend>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="이름 (애칭도 좋아요)"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className="rounded-lg border border-[#F0997B]/50 bg-white px-3 py-2 text-[#4A1B0C] placeholder:text-[#993C1D]/40 focus:outline-none focus:ring-2 focus:ring-[#D85A30]/40"
        />
        <input
          type="date"
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
          className="rounded-lg border border-[#F0997B]/50 bg-white px-3 py-2 text-[#4A1B0C] focus:outline-none focus:ring-2 focus:ring-[#D85A30]/40"
        />
        <select
          value={value.time}
          onChange={(e) => onChange({ ...value, time: e.target.value })}
          className="rounded-lg border border-[#F0997B]/50 bg-white px-3 py-2 text-[#4A1B0C] focus:outline-none focus:ring-2 focus:ring-[#D85A30]/40"
        >
          <option value="unknown">{timeRequired ? "태어난 시간 선택" : "태어난 시간 몰라요"}</option>
          {HOURS.map((h) => (
            <option key={h} value={h}>{h}시 ~ {h}시 59분</option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}
