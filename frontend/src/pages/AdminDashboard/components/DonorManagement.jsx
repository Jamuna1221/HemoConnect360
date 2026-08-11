import { FaSearch, FaFilter, FaMapMarkerAlt, FaBan, FaCheck } from 'react-icons/fa'

const DonorManagement = ({ donors, searchQuery, setSearchQuery, bloodFilter, setBloodFilter, onToggleStatus }) => {
  const filteredDonors = donors.filter(d => {
    const matchesSearch = d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || d.city.toLowerCase().includes(searchQuery.toLowerCase()) || d.phone.includes(searchQuery)
    const matchesBlood = bloodFilter === 'all' || d.bloodGroup === bloodFilter
    return matchesSearch && matchesBlood
  })

  return (
    <div className="tab-panel">
      <div className="data-toolbar">
        <div className="search-wrap">
          <FaSearch />
          <input
            type="text"
            placeholder="Search donors by name, location, phone..."
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
              <th>Donor Name</th>
              <th>Blood Group</th>
              <th>Email / Phone</th>
              <th>Location</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDonors.map(d => (
              <tr key={d.id}>
                <td className="font-semibold">{d.fullName}</td>
                <td><span className="blood-badge">{d.bloodGroup}</span></td>
                <td>
                  <div>{d.email}</div>
                  <div className="phone-sub">{d.phone}</div>
                </td>
                <td><FaMapMarkerAlt className="icon-sub" /> {d.city}</td>
                <td><span className={`status-badge status-badge--${d.status}`}>{d.status}</span></td>
                <td>
                  <button
                    className={`action-btn-status ${d.status === 'active' ? 'action-btn-status--suspend' : 'action-btn-status--activate'}`}
                    onClick={() => onToggleStatus(d.id)}
                  >
                    {d.status === 'active' ? <FaBan /> : <FaCheck />} {d.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredDonors.length === 0 && (
              <tr>
                <td colSpan="6" className="table-empty">No donors matched criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DonorManagement
