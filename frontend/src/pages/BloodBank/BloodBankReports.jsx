import { FaChartBar } from 'react-icons/fa'
import BloodBankPlaceholder from '../../components/BloodBank/BloodBankPlaceholder'

const BloodBankReports = () => (
  <BloodBankPlaceholder
    title="Reports"
    description="View usage, donation and inventory reports for your blood bank."
    icon={<FaChartBar />}
  />
)

export default BloodBankReports
