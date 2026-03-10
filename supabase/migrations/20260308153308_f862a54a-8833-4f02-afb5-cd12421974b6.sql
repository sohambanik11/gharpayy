-- Allow anon read access for development (no auth yet)
CREATE POLICY "Anon read agents" ON public.agents FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read properties" ON public.properties FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read leads" ON public.leads FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read visits" ON public.visits FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read conversations" ON public.conversations FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read reminders" ON public.follow_up_reminders FOR SELECT TO anon USING (true);