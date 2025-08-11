
create or replace function update_my_contact_info(new_personal_email text, new_phone text)
returns void as $$
begin
  update public.company_users
  set
    personal_email = new_personal_email,
    phone = new_phone
  where
    id = auth.uid();
end;
$$ language plpgsql security definer;

grant execute on function public.update_my_contact_info(text, text) to authenticated;
