import { FaSearch, FaFilter } from 'react-icons/fa'

const BloodRequests = ({ requests, searchQuery, setSearchQuery, bloodFilter, setBloodFilter }) => {
  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || r.city.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBlood = bloodFilter === 'all' || r.bloodGroup === bloodFilter
    return matchesSearch && matchesBlood
  })

  return (
    <div className="tab-panel">
      <div className="data-toolbar">
        <div className="search-wrap">
          <FaSearch />
          <input
            type="text"
            placeholder="Search requests by patient, hospital..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-wrap">
          <FaFilter />
          <select value={bloodFilter} onChange={(e) => setBloodFilter(e.target.value)}>
            <option value="all">All Groups</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Hospital</th>
              <th>Blood Info</th>
              <th>Urgency</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map(r => (
              <tr key={r.id}>
                <td className="font-semibold">{r.patientName}</td>
                <td>
                  <div>{r.hospitalName}</div>
                  <div className="phone-sub">{r.city}</div>
                </td>
                <td><span className="blood-badge">{r.bloodGroup}</span> ({r.units} Units)</td>
                <td><span className={`urgency-badge urgency-badge--${r.priority}`}>{r.priority}</span></td>
                <td><span className={`status-badge status-badge--${r.status}`}>{r.status}</span></td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan="5" className="table-empty">No blood requests matched criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default BloodRequests
