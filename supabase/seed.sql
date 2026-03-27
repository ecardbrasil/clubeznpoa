-- ClubeZN demo seed data (idempotent)
-- Run after supabase/schema.sql

-- 1) Users first (without company_id to avoid circular FK at insert time)
insert into public.users (
  id, name, email, phone, neighborhood, password, role, company_id, blocked, created_at
)
values
  (
    'u_admin',
    'Administrador ClubeZN',
    'admin@clubezn.com',
    null,
    null,
    'scrypt$6fd89e43c6bc7499deb795241edf7bb7$16c46e979c4987750a12a2568411f01f548548b06d76fe7e4b1346451f8222a40fb29936e7eb1dc4a7e1976f59fb43128bb3897feaa9845890a248bebc5ca0fb',
    'admin',
    null,
    false,
    now()
  ),
  (
    'u_partner_1',
    'Mercado Sarandi',
    'parceiro@sarandi.com',
    '51999990001',
    'Sarandi',
    'scrypt$b3252cd1ce042237f0ee071b9556e657$2481459bfe11c650ca2ed8018e534a0bba146482f9691df93b9ddf02ca9f1aae49439df057ab4604acc1610f6643fc6fb4b2a513e595c75f520f2c775ab2f80c',
    'partner',
    null,
    false,
    now()
  ),
  (
    'u_consumer_1',
    'Morador ZN',
    'cliente@clubezn.com',
    '51999990002',
    'Sarandi',
    'scrypt$3fe1afade468393a8b99bbea9383f587$0edac7d66c3aea9c69c6c5f991ad0d4afb7b1fdd3183375c2d00247c99e145d98a499139ae456ad70fdf4f39ac7a72cb9d9c54189402636f33237bd1adcb15dd',
    'consumer',
    null,
    false,
    now()
  )
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  phone = excluded.phone,
  neighborhood = excluded.neighborhood,
  password = excluded.password,
  role = excluded.role,
  blocked = excluded.blocked;

-- 2) Companies
insert into public.companies (
  id, name, public_name, category, neighborhood, city, state, owner_user_id, approved,
  logo_image, cover_image, address_line, bio, instagram, facebook, website, whatsapp, created_at
)
values
  (
    'c_1',
    'Mercado Sarandi',
    'Mercado Sarandi',
    'Supermercado',
    'Sarandi',
    'Porto Alegre',
    'RS',
    'u_partner_1',
    true,
    null,
    null,
    'Av. Baltazar de Oliveira Garcia, 1200 - Sarandi, Porto Alegre/RS',
    'Mercado de bairro com foco em economia no dia a dia.',
    '@mercadosarandi',
    null,
    null,
    '51999990001',
    now()
  ),
  (
    'c_2',
    'Farmacia Zona Norte',
    'Farmacia Zona Norte',
    'Farmacia',
    'Passo das Pedras',
    'Porto Alegre',
    'RS',
    'u_admin',
    true,
    null,
    null,
    'Av. Assis Brasil, 3450 - Passo das Pedras, Porto Alegre/RS',
    'Farmacia com ofertas semanais para moradores da regiao.',
    null,
    null,
    null,
    null,
    now()
  )
on conflict (id) do update set
  name = excluded.name,
  public_name = excluded.public_name,
  category = excluded.category,
  neighborhood = excluded.neighborhood,
  city = excluded.city,
  state = excluded.state,
  owner_user_id = excluded.owner_user_id,
  approved = excluded.approved,
  logo_image = excluded.logo_image,
  cover_image = excluded.cover_image,
  address_line = excluded.address_line,
  bio = excluded.bio,
  instagram = excluded.instagram,
  facebook = excluded.facebook,
  website = excluded.website,
  whatsapp = excluded.whatsapp;

-- 3) Link partner user -> company
update public.users
set company_id = 'c_1'
where id = 'u_partner_1';

-- 4) Offers
insert into public.offers (
  id, company_id, title, description, discount_label, category, neighborhood, images, approved, rejected, created_at
)
values
  (
    'o_1',
    'c_1',
    '10% em compras acima de R$80',
    'Desconto valido em produtos selecionados do mercado.',
    '10% OFF',
    'Supermercado',
    'Sarandi',
    array[
      'https://picsum.photos/id/292/1200/675',
      'https://picsum.photos/id/312/1200/675',
      'https://picsum.photos/id/425/1200/675'
    ],
    true,
    false,
    now()
  ),
  (
    'o_2',
    'c_2',
    '15% em medicamentos genericos',
    'Valido para itens participantes, sujeito a disponibilidade.',
    '15% OFF',
    'Farmacia',
    'Passo das Pedras',
    array[
      'https://picsum.photos/id/1059/1200/675',
      'https://picsum.photos/id/1060/1200/675',
      'https://picsum.photos/id/1025/1200/675'
    ],
    true,
    false,
    now()
  ),
  (
    'o_3',
    'c_1',
    'Leve 3 paes e pague 2',
    'Promocao valida para paes franceses e integrais no mesmo cupom.',
    'PAGUE 2',
    'Alimentacao',
    'Sarandi',
    array[
      'https://picsum.photos/id/431/1200/675',
      'https://picsum.photos/id/766/1200/675'
    ],
    true,
    false,
    now()
  ),
  (
    'o_4',
    'c_1',
    '20% OFF em banho e tosa',
    'Desconto para servicos agendados durante a semana.',
    '20% OFF',
    'Pet',
    'Sarandi',
    array[
      'https://picsum.photos/id/237/1200/675',
      'https://picsum.photos/id/169/1200/675'
    ],
    true,
    false,
    now()
  )
on conflict (id) do update set
  company_id = excluded.company_id,
  title = excluded.title,
  description = excluded.description,
  discount_label = excluded.discount_label,
  category = excluded.category,
  neighborhood = excluded.neighborhood,
  images = excluded.images,
  approved = excluded.approved,
  rejected = excluded.rejected;

-- 5) Optional sample redemptions
insert into public.redemptions (
  id, user_id, offer_id, code, status, created_at, expires_at, used_at
)
values
  (
    'r_seed_1',
    'u_consumer_1',
    'o_1',
    '123456',
    'used',
    now() - interval '2 days',
    now() - interval '2 days' + interval '10 minutes',
    now() - interval '2 days' + interval '5 minutes'
  ),
  (
    'r_seed_2',
    'u_consumer_1',
    'o_2',
    '654321',
    'generated',
    now() - interval '20 minutes',
    now() - interval '10 minutes',
    null
  )
on conflict (id) do update set
  user_id = excluded.user_id,
  offer_id = excluded.offer_id,
  code = excluded.code,
  status = excluded.status,
  created_at = excluded.created_at,
  expires_at = excluded.expires_at,
  used_at = excluded.used_at;

-- 6) Optional sample notifications
insert into public.notifications (
  id, user_id, company_id, offer_id, type, title, message, read, created_at
)
values
  (
    'n_seed_1',
    'u_partner_1',
    'c_1',
    null,
    'company_approved',
    'Empresa aprovada',
    'Sua empresa Mercado Sarandi foi aprovada.',
    true,
    now() - interval '3 days'
  ),
  (
    'n_seed_2',
    'u_partner_1',
    'c_1',
    'o_1',
    'offer_approved',
    'Oferta aprovada',
    'A oferta "10% em compras acima de R$80" foi aprovada.',
    false,
    now() - interval '1 day'
  )
on conflict (id) do update set
  user_id = excluded.user_id,
  company_id = excluded.company_id,
  offer_id = excluded.offer_id,
  type = excluded.type,
  title = excluded.title,
  message = excluded.message,
  read = excluded.read,
  created_at = excluded.created_at;
