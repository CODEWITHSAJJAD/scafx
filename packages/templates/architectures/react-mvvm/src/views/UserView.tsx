import { useUserViewModel } from '../viewmodels/useUserViewModel';

export function UserView() {
  const { user, updateRole } = useUserViewModel();

  return (
    <div style={{ padding: '1.5rem', border: '1px solid #3f3f46', borderRadius: '8px' }}>
      <h2>MVVM User View</h2>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Role:</strong> {user.role}</p>
      <button 
        onClick={() => updateRole('Principal Engineer')}
        style={{ padding: '0.5rem 1rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Promote
      </button>
    </div>
  );
}
