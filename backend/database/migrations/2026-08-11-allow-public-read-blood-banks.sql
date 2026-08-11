-- Allow public select on blood_banks so that requesters, donors, and the admin panel can view them.
drop policy if exists "blood_banks_select_all" on public.blood_banks;
create policy "blood_banks_select_all" on public.blood_banks
  for select using (true);

-- Allow public select on blood_bank_inventory so everyone can view live stock levels.
drop policy if exists "blood_bank_inventory_select_all" on public.blood_bank_inventory;
create policy "blood_bank_inventory_select_all" on public.blood_bank_inventory
  for select using (true);
