import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FaUser,
  FaCalendarAlt,
  FaTint,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCity,
  FaWeight,
  FaHeartbeat,
  FaClock,
  FaUpload,
} from 'react-icons/fa'

const INITIAL_FORM = {
  fullName: '',
  dob: '',
  gender: '',
  bloodGroup: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  weight: '',
  hemoglobin: '',
  lastDonation: '',
  idProof: null,
  terms: false,
}

const DonorForm = () => {
  const [formData, setFormData] = useState(INITIAL_FORM)

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
  }

  return (
    <section className="donor-form">
      <h2 className="donor-form__title">Donor Registration Form</h2>
      <form className="donor-form__form" onSubmit={handleSubmit}>
        <div className="donor-form__grid">
          <div className="donor-form__field">
            <label htmlFor="fullName">Full Name</label>
            <div className="donor-form__input-wrapper">
              <FaUser className="donor-form__input-icon" />
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="donor-form__field">
            <label htmlFor="dob">Date of Birth</label>
            <div className="donor-form__input-wrapper">
              <FaCalendarAlt className="donor-form__input-icon" />
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="donor-form__field">
            <label htmlFor="gender">Gender</label>
            <div className="donor-form__input-wrapper">
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="donor-form__field">
            <label htmlFor="bloodGroup">Blood Group</label>
            <div className="donor-form__input-wrapper">
              <FaTint className="donor-form__input-icon" />
              <select
                id="bloodGroup"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
              >
                <option value="">Select blood group</option>
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

          <div className="donor-form__field">
            <label htmlFor="phone">Phone Number</label>
            <div className="donor-form__input-wrapper">
              <FaPhone className="donor-form__input-icon" />
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="donor-form__field">
            <label htmlFor="email">Email</label>
            <div className="donor-form__input-wrapper">
              <FaEnvelope className="donor-form__input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="donor-form__field donor-form__field--full">
            <label htmlFor="address">Address</label>
            <div className="donor-form__input-wrapper">
              <FaMapMarkerAlt className="donor-form__input-icon" />
              <input
                type="text"
                id="address"
                name="address"
                placeholder="Enter your address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="donor-form__field">
            <label htmlFor="city">City</label>
            <div className="donor-form__input-wrapper">
              <FaCity className="donor-form__input-icon" />
              <input
                type="text"
                id="city"
                name="city"
                placeholder="Enter city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="donor-form__field">
            <label htmlFor="state">State</label>
            <div className="donor-form__input-wrapper">
              <input
                type="text"
                id="state"
                name="state"
                placeholder="Enter state"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="donor-form__field">
            <label htmlFor="pincode">Pincode</label>
            <div className="donor-form__input-wrapper">
              <input
                type="text"
                id="pincode"
                name="pincode"
                placeholder="Enter pincode"
                value={formData.pincode}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="donor-form__field">
            <label htmlFor="weight">Weight (kg)</label>
            <div className="donor-form__input-wrapper">
              <FaWeight className="donor-form__input-icon" />
              <input
                type="number"
                id="weight"
                name="weight"
                placeholder="Enter weight"
                value={formData.weight}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="donor-form__field">
            <label htmlFor="hemoglobin">Hemoglobin (g/dL)</label>
            <div className="donor-form__input-wrapper">
              <FaHeartbeat className="donor-form__input-icon" />
              <input
                type="number"
                id="hemoglobin"
                name="hemoglobin"
                placeholder="Enter hemoglobin level"
                step="0.1"
                value={formData.hemoglobin}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="donor-form__field">
            <label htmlFor="lastDonation">Last Donation Date</label>
            <div className="donor-form__input-wrapper">
              <FaClock className="donor-form__input-icon" />
              <input
                type="date"
                id="lastDonation"
                name="lastDonation"
                value={formData.lastDonation}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="donor-form__field donor-form__field--full">
            <label htmlFor="idProof">Upload ID Proof</label>
            <div className="donor-form__input-wrapper donor-form__input-wrapper--file">
              <FaUpload className="donor-form__input-icon" />
              <input
                type="file"
                id="idProof"
                name="idProof"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleChange}
              />
              <span className="donor-form__file-label">
                {formData.idProof ? formData.idProof.name : 'Choose file (PDF, JPG, PNG)'}
              </span>
            </div>
          </div>

          <div className="donor-form__field donor-form__field--full">
            <label className="donor-form__checkbox">
              <input
                type="checkbox"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
              />
              <span className="donor-form__checkbox-mark"></span>
              <span className="donor-form__checkbox-text">
                I have read and agree to the{' '}
                <Link to="/terms-and-conditions" className="donor-form__terms-link">
                  Terms & Conditions
                </Link>{' '}
                and Privacy Policy.
              </span>
            </label>
          </div>
        </div>

        <button type="submit" className="donor-form__submit">
          Register as Donor
        </button>
      </form>
    </section>
  )
}

export default DonorForm
