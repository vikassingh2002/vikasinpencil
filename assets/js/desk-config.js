/* Where the desk keeps its things: your Supabase project.

   Both values are public by design. They only let a browser ask the
   database for things; the database's own rules (supabase/schema.sql)
   decide what each person may read or change. Leave them empty and the
   desk keeps everything in the browser instead.

   Never put the secret key (it starts with sb_secret_, or is called
   service_role) or the database password here: this file is published
   with the site for anyone to read. */
window.NB = window.NB || {};
NB.deskConfig = {
  supabaseUrl: '', // Project URL, like https://abcdefgh.supabase.co
  supabaseKey: ''  // Publishable key (sb_publishable_…), or the older "anon public" key
};
