import re

filepath = 'src/App.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the onAuthStateChange missing profile fetch
old_auth_change = """    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session) {
         setIsSessionActive(true);
         localStorage.setItem('si_kka_session_active', 'true');
      } else {"""

new_auth_change = """    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session) {
         setIsSessionActive(true);
         localStorage.setItem('si_kka_session_active', 'true');
         const name = session.user.user_metadata?.full_name || session.user.email || 'Auditor';
         setCustomAuditorName(name);
         
         supabase.from('profiles').select('role').eq('id', session.user.id).single()
           .then(({ data }) => {
              if (data?.role) {
                setUserRole(data.role as any);
                localStorage.setItem('si_kka_user_role', data.role);
              }
           });
      } else {"""

content = content.replace(old_auth_change, new_auth_change)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
