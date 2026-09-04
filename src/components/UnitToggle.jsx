import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function UnitToggle() {
  const { user, refreshUser } = useAuth();
  const unit = user.weight_unit || 'kg';

  async function setUnit(next) {
    if (next === unit) return;
    await api.setWeightUnit(next);
    await refreshUser();
  }

  return (
    <div className="unit-toggle">
      <button className={unit === 'kg' ? 'active' : ''} onClick={() => setUnit('kg')}>kg</button>
      <button className={unit === 'lb' ? 'active' : ''} onClick={() => setUnit('lb')}>lb</button>
    </div>
  );
}
