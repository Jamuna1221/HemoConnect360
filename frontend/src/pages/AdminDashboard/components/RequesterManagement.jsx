import { FaSearch, FaMapMarkerAlt, FaBan, FaCheck } from 'react-icons/fa'

const RequesterManagement = ({ requesters, searchQuery, setSearchQuery, onToggleStatus }) => {
  const filteredRequesters = requesters.filter(r => {
    const matchesSearch = r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || r.city.toLowerCase().includes(searchQuery.toLowerCase()) || r.phone.includes(searchQuery)
    return matchesSearch
  })

  return (
    <div className="tab-panel">
      <div className="data-toolbar">
        <div className="search-wrap">
          <FaSearch />
          <input
            type="text"
            placeholder="Search requesters by name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Requester Name</th>
              <th>Email / Phone</th>
              <th>City</th>
              <th>Active Requests</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequesters.map(r => (
              <tr key={r.id}>
                <td className="font-semibold">{r.fullName}</td>
                <td>
                  <div>{r.email}</div>
                  <div className="phone-sub">{r.phone}</div>
                </td>
                <td><FaMapMarkerAlt className="icon-sub" /> {r.city}</td>
                <td>{r.activeRequests} Requests</td>
                <td><span className={`status-badge status-badge--${r.status}`}>{r.status}</span></td>
                <td>
                  <button
                    className={`action-btn-status ${r.status === 'active' ? 'action-btn-status--suspend' : 'action-btn-status--activate'}`}
                    onClick={() => onToggleStatus(r.id)}
                  >
                    {r.status === 'active' ? <FaBan /> : <FaCheck />} {r.status === 'active' ? 'Flag Account' : 'Clear Account'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredRequesters.length === 0 && (
              <tr>
                <td colSpan="6" className="table-empty">No requesters matched criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RequesterManagement
