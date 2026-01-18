package repositories

import (
	"database/sql"
	"errors"
	"strings"
	"time"
	"taulen/backend/internal/database"
)

// Borrower represents a borrower in the database
type Borrower struct {
	ID                          int64
	EmailAddress                sql.NullString
	PasswordHash                sql.NullString
	EmailVerified               sql.NullBool
	EmailVerificationToken      sql.NullString
	EmailVerificationExpiresAt  sql.NullTime
	PasswordResetToken          sql.NullString
	PasswordResetExpiresAt      sql.NullTime
	LastPasswordChangeAt        sql.NullTime
	MFAEnabled                  sql.NullBool
	MFASecret                   sql.NullString
	MFABackupCodes              sql.NullString
	MFASetupAt                  sql.NullTime
	MFAVerifiedAt               sql.NullTime
	LastLoginAt                 sql.NullTime
	FailedLoginAttempts         sql.NullInt64
	AccountLockedUntil          sql.NullTime
	FirstName                   string
	MiddleName                  sql.NullString
	LastName                    string
	Suffix                      sql.NullString
	TaxpayerIDType              sql.NullString
	TaxpayerIDValue             sql.NullString
	BirthDate                   sql.NullTime
	CitizenshipType             sql.NullString
	MaritalStatus               sql.NullString
	DependentCount              sql.NullInt64
	DependentAges               sql.NullString
	HomePhone                   sql.NullString
	MobilePhone                 sql.NullString
	WorkPhone                   sql.NullString
	WorkPhoneExt                sql.NullString
	MilitaryServiceStatus       sql.NullBool
	ConsentToCreditCheck        sql.NullBool
	ConsentToContact            sql.NullBool
	CreatedAt                   sql.NullTime
	UpdatedAt                   sql.NullTime
}

// BorrowerRepository handles borrower data access
type BorrowerRepository struct {
	db *sql.DB
}

// NewBorrowerRepository creates a new borrower repository
func NewBorrowerRepository() *BorrowerRepository {
	return &BorrowerRepository{
		db: database.DB,
	}
}

// GetByEmail retrieves a borrower by email (for authentication)
func (r *BorrowerRepository) GetByEmail(email string) (*Borrower, error) {
	query := `SELECT id, email_address, password_hash, email_verified, email_verification_token, 
	          email_verification_expires_at, password_reset_token, password_reset_expires_at, 
	          last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at, 
	          mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
	          first_name, middle_name, last_name, suffix, taxpayer_identifier_type, 
	          taxpayer_identifier_value, birth_date, citizenship_residency_type, marital_status, 
	          dependent_count, dependent_ages, home_phone, mobile_phone, work_phone, 
	          work_phone_extension, created_at, updated_at
	          FROM borrower WHERE LOWER(email_address) = LOWER($1) AND email_address IS NOT NULL`
	row := r.db.QueryRow(query, email)

	borrower := &Borrower{}
	err := row.Scan(
		&borrower.ID, &borrower.EmailAddress, &borrower.PasswordHash,
		&borrower.EmailVerified, &borrower.EmailVerificationToken, &borrower.EmailVerificationExpiresAt,
		&borrower.PasswordResetToken, &borrower.PasswordResetExpiresAt, &borrower.LastPasswordChangeAt,
		&borrower.MFAEnabled, &borrower.MFASecret, &borrower.MFABackupCodes, &borrower.MFASetupAt,
		&borrower.MFAVerifiedAt, &borrower.LastLoginAt, &borrower.FailedLoginAttempts, &borrower.AccountLockedUntil,
		&borrower.FirstName, &borrower.MiddleName, &borrower.LastName, &borrower.Suffix,
		&borrower.TaxpayerIDType, &borrower.TaxpayerIDValue, &borrower.BirthDate,
		&borrower.CitizenshipType, &borrower.MaritalStatus, &borrower.DependentCount,
		&borrower.DependentAges, &borrower.HomePhone, &borrower.MobilePhone,
		&borrower.WorkPhone, &borrower.WorkPhoneExt, &borrower.CreatedAt, &borrower.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}
	return borrower, nil
}

// GetByPhone retrieves a borrower by phone number (checks mobile_phone, home_phone, and work_phone)
func (r *BorrowerRepository) GetByPhone(phone string) (*Borrower, error) {
	query := `SELECT id, email_address, password_hash, email_verified, email_verification_token, 
	          email_verification_expires_at, password_reset_token, password_reset_expires_at, 
	          last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at, 
	          mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
	          first_name, middle_name, last_name, suffix, taxpayer_identifier_type, 
	          taxpayer_identifier_value, birth_date, citizenship_residency_type, marital_status, 
	          dependent_count, dependent_ages, home_phone, mobile_phone, work_phone, 
	          work_phone_extension, created_at, updated_at
	          FROM borrower 
	          WHERE mobile_phone = $1 OR home_phone = $1 OR work_phone = $1
	          LIMIT 1`
	row := r.db.QueryRow(query, phone)

	borrower := &Borrower{}
	err := row.Scan(
		&borrower.ID, &borrower.EmailAddress, &borrower.PasswordHash,
		&borrower.EmailVerified, &borrower.EmailVerificationToken, &borrower.EmailVerificationExpiresAt,
		&borrower.PasswordResetToken, &borrower.PasswordResetExpiresAt, &borrower.LastPasswordChangeAt,
		&borrower.MFAEnabled, &borrower.MFASecret, &borrower.MFABackupCodes, &borrower.MFASetupAt,
		&borrower.MFAVerifiedAt, &borrower.LastLoginAt, &borrower.FailedLoginAttempts, &borrower.AccountLockedUntil,
		&borrower.FirstName, &borrower.MiddleName, &borrower.LastName, &borrower.Suffix,
		&borrower.TaxpayerIDType, &borrower.TaxpayerIDValue, &borrower.BirthDate,
		&borrower.CitizenshipType, &borrower.MaritalStatus, &borrower.DependentCount,
		&borrower.DependentAges, &borrower.HomePhone, &borrower.MobilePhone,
		&borrower.WorkPhone, &borrower.WorkPhoneExt, &borrower.CreatedAt, &borrower.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}
	return borrower, nil
}

// GetByID retrieves a borrower by ID
func (r *BorrowerRepository) GetByID(id int64) (*Borrower, error) {
	query := `SELECT id, email_address, password_hash, email_verified, email_verification_token, 
	          email_verification_expires_at, password_reset_token, password_reset_expires_at, 
	          last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at, 
	          mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
	          first_name, middle_name, last_name, suffix, taxpayer_identifier_type, 
	          taxpayer_identifier_value, birth_date, citizenship_residency_type, marital_status, 
	          dependent_count, dependent_ages, home_phone, mobile_phone, work_phone, 
	          work_phone_extension, military_service_status, consent_to_credit_check, consent_to_contact,
	          created_at, updated_at
	          FROM borrower WHERE id = $1`
	row := r.db.QueryRow(query, id)

	borrower := &Borrower{}
	err := row.Scan(
		&borrower.ID, &borrower.EmailAddress, &borrower.PasswordHash,
		&borrower.EmailVerified, &borrower.EmailVerificationToken, &borrower.EmailVerificationExpiresAt,
		&borrower.PasswordResetToken, &borrower.PasswordResetExpiresAt, &borrower.LastPasswordChangeAt,
		&borrower.MFAEnabled, &borrower.MFASecret, &borrower.MFABackupCodes, &borrower.MFASetupAt,
		&borrower.MFAVerifiedAt, &borrower.LastLoginAt, &borrower.FailedLoginAttempts, &borrower.AccountLockedUntil,
		&borrower.FirstName, &borrower.MiddleName, &borrower.LastName, &borrower.Suffix,
		&borrower.TaxpayerIDType, &borrower.TaxpayerIDValue, &borrower.BirthDate,
		&borrower.CitizenshipType, &borrower.MaritalStatus, &borrower.DependentCount,
		&borrower.DependentAges, &borrower.HomePhone, &borrower.MobilePhone,
		&borrower.WorkPhone, &borrower.WorkPhoneExt, &borrower.MilitaryServiceStatus,
		&borrower.ConsentToCreditCheck, &borrower.ConsentToContact, &borrower.CreatedAt, &borrower.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return borrower, nil
}

// Create creates a new borrower in the borrower table (during signup)
func (r *BorrowerRepository) Create(email, passwordHash, firstName, lastName, phone string) (*Borrower, error) {
	// Validate that password hash is not empty
	if passwordHash == "" {
		return nil, errors.New("password hash cannot be empty")
	}
	
	query := `INSERT INTO borrower (email_address, password_hash, first_name, last_name, mobile_phone) 
	          VALUES ($1, $2, $3, $4, $5) 
	          RETURNING id, email_address, password_hash, email_verified, email_verification_token, 
	          email_verification_expires_at, password_reset_token, password_reset_expires_at, 
	          last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at, 
	          mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
	          first_name, middle_name, last_name, suffix, taxpayer_identifier_type, 
	          taxpayer_identifier_value, birth_date, citizenship_residency_type, marital_status, 
	          dependent_count, dependent_ages, home_phone, mobile_phone, work_phone, 
	          work_phone_extension, created_at, updated_at`
	row := r.db.QueryRow(query, email, passwordHash, firstName, lastName, phone)

	borrower := &Borrower{}
	err := row.Scan(
		&borrower.ID, &borrower.EmailAddress, &borrower.PasswordHash,
		&borrower.EmailVerified, &borrower.EmailVerificationToken, &borrower.EmailVerificationExpiresAt,
		&borrower.PasswordResetToken, &borrower.PasswordResetExpiresAt, &borrower.LastPasswordChangeAt,
		&borrower.MFAEnabled, &borrower.MFASecret, &borrower.MFABackupCodes, &borrower.MFASetupAt,
		&borrower.MFAVerifiedAt, &borrower.LastLoginAt, &borrower.FailedLoginAttempts, &borrower.AccountLockedUntil,
		&borrower.FirstName, &borrower.MiddleName, &borrower.LastName, &borrower.Suffix,
		&borrower.TaxpayerIDType, &borrower.TaxpayerIDValue, &borrower.BirthDate,
		&borrower.CitizenshipType, &borrower.MaritalStatus, &borrower.DependentCount,
		&borrower.DependentAges, &borrower.HomePhone, &borrower.MobilePhone,
		&borrower.WorkPhone, &borrower.WorkPhoneExt, &borrower.CreatedAt, &borrower.UpdatedAt,
	)
	if err != nil {
		// Check for unique constraint violation
		errStr := err.Error()
		if strings.Contains(errStr, "duplicate key") || strings.Contains(errStr, "unique constraint") {
			if strings.Contains(errStr, "email") || strings.Contains(strings.ToLower(errStr), "email") {
				return nil, errors.New("borrower with this email already exists")
			}
		}
		return nil, err
	}
	return borrower, nil
}

// CreateFromPreApplication creates a borrower from pre-application data (without password)
// This is used when a borrower completes the pre-application wizard
// They will set a password later when they register/login
func (r *BorrowerRepository) CreateFromPreApplication(email, firstName, lastName, phone, dateOfBirth, address, city, state, zipCode string) (*Borrower, error) {
	query := `INSERT INTO borrower (email_address, first_name, last_name, mobile_phone, birth_date, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5::date, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
	          RETURNING id, email_address, password_hash, email_verified, email_verification_token, 
	          email_verification_expires_at, password_reset_token, password_reset_expires_at, 
	          last_password_change_at, mfa_enabled, mfa_secret, mfa_backup_codes, mfa_setup_at, 
	          mfa_verified_at, last_login_at, failed_login_attempts, account_locked_until,
	          first_name, middle_name, last_name, suffix, taxpayer_identifier_type, 
	          taxpayer_identifier_value, birth_date, citizenship_residency_type, marital_status, 
	          dependent_count, dependent_ages, home_phone, mobile_phone, work_phone, 
	          work_phone_extension, created_at, updated_at`
	
	var birthDate sql.NullTime
	if dateOfBirth != "" {
		birthDate.Valid = true
		// Parse date string (assuming format YYYY-MM-DD)
		if t, err := time.Parse("2006-01-02", dateOfBirth); err == nil {
			birthDate.Time = t
		}
	}
	
	row := r.db.QueryRow(query, email, firstName, lastName, phone, birthDate)

	borrower := &Borrower{}
	err := row.Scan(
		&borrower.ID, &borrower.EmailAddress, &borrower.PasswordHash,
		&borrower.EmailVerified, &borrower.EmailVerificationToken, &borrower.EmailVerificationExpiresAt,
		&borrower.PasswordResetToken, &borrower.PasswordResetExpiresAt, &borrower.LastPasswordChangeAt,
		&borrower.MFAEnabled, &borrower.MFASecret, &borrower.MFABackupCodes, &borrower.MFASetupAt,
		&borrower.MFAVerifiedAt, &borrower.LastLoginAt, &borrower.FailedLoginAttempts, &borrower.AccountLockedUntil,
		&borrower.FirstName, &borrower.MiddleName, &borrower.LastName, &borrower.Suffix,
		&borrower.TaxpayerIDType, &borrower.TaxpayerIDValue, &borrower.BirthDate,
		&borrower.CitizenshipType, &borrower.MaritalStatus, &borrower.DependentCount,
		&borrower.DependentAges, &borrower.HomePhone, &borrower.MobilePhone,
		&borrower.WorkPhone, &borrower.WorkPhoneExt, &borrower.CreatedAt, &borrower.UpdatedAt,
	)
	if err != nil {
		// Check for unique constraint violation
		errStr := err.Error()
		if strings.Contains(errStr, "duplicate key") || strings.Contains(errStr, "unique constraint") {
			if strings.Contains(errStr, "email") || strings.Contains(strings.ToLower(errStr), "email") {
				return nil, errors.New("borrower with this email already exists")
			}
		}
		return nil, err
	}
	return borrower, nil
}

// SetVerificationCode stores a verification code for a borrower
func (r *BorrowerRepository) SetVerificationCode(email, code, method string, expiresAt time.Time) error {
	query := `UPDATE borrower 
	          SET verification_code = $1, 
	              verification_code_expires_at = $2,
	              verification_method = $3,
	              updated_at = CURRENT_TIMESTAMP
	          WHERE LOWER(email_address) = LOWER($4) AND email_address IS NOT NULL`
	
	_, err := r.db.Exec(query, code, expiresAt, method, email)
	return err
}

// VerifyCode checks if a verification code is valid for a borrower
func (r *BorrowerRepository) VerifyCode(email, code string) (bool, error) {
	query := `SELECT verification_code, verification_code_expires_at 
	          FROM borrower 
	          WHERE LOWER(email_address) = LOWER($1) 
	          AND email_address IS NOT NULL
	          AND verification_code = $2
	          AND verification_code_expires_at > CURRENT_TIMESTAMP`
	
	var storedCode sql.NullString
	var expiresAt sql.NullTime
	
	err := r.db.QueryRow(query, email, code).Scan(&storedCode, &expiresAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	
	return storedCode.Valid && storedCode.String == code, nil
}

// ClearVerificationCode clears the verification code after successful verification
func (r *BorrowerRepository) ClearVerificationCode(email string) error {
	query := `UPDATE borrower 
	          SET verification_code = NULL, 
	              verification_code_expires_at = NULL,
	              verification_method = NULL,
	              email_verified = TRUE,
	              updated_at = CURRENT_TIMESTAMP
	          WHERE LOWER(email_address) = LOWER($1) AND email_address IS NOT NULL`
	
	_, err := r.db.Exec(query, email)
	return err
}

// UpdatePassword updates a borrower's password
func (r *BorrowerRepository) UpdatePassword(borrowerID int64, passwordHash string) error {
	query := `UPDATE borrower 
	          SET password_hash = $1,
	              last_password_change_at = CURRENT_TIMESTAMP,
	              updated_at = CURRENT_TIMESTAMP
	          WHERE id = $2`
	
	_, err := r.db.Exec(query, passwordHash, borrowerID)
	return err
}

// UpdateName updates a borrower's name
func (r *BorrowerRepository) UpdateName(borrowerID int64, firstName, lastName string) error {
	query := `UPDATE borrower 
	          SET first_name = $1,
	              last_name = $2,
	              updated_at = CURRENT_TIMESTAMP
	          WHERE id = $3`
	
	_, err := r.db.Exec(query, firstName, lastName, borrowerID)
	return err
}

// UpdateBorrowerInfo updates borrower personal information (date of birth, etc.)
func (r *BorrowerRepository) UpdateBorrowerInfo(id int64, dateOfBirth *time.Time) error {
	query := `UPDATE borrower SET 
	          birth_date = $1, 
	          updated_at = CURRENT_TIMESTAMP
	          WHERE id = $2`
	_, err := r.db.Exec(query, dateOfBirth, id)
	return err
}

// UpdateBorrowerDetails updates borrower details including middle name, suffix, marital status, and phone
func (r *BorrowerRepository) UpdateBorrowerDetails(id int64, middleName, suffix, maritalStatus *string, phone, phoneType *string) error {
	query := `UPDATE borrower SET 
	          middle_name = COALESCE($1, middle_name),
	          suffix = COALESCE($2, suffix),
	          marital_status = COALESCE($3, marital_status),
	          mobile_phone = CASE WHEN $5 = 'MOBILE' THEN COALESCE($4, mobile_phone) ELSE mobile_phone END,
	          home_phone = CASE WHEN $5 = 'HOME' THEN COALESCE($4, home_phone) ELSE home_phone END,
	          work_phone = CASE WHEN $5 = 'WORK' THEN COALESCE($4, work_phone) ELSE work_phone END,
	          updated_at = CURRENT_TIMESTAMP
	          WHERE id = $6`
	_, err := r.db.Exec(query, middleName, suffix, maritalStatus, phone, phoneType, id)
	return err
}

// UpdateEmail updates a borrower's email address
func (r *BorrowerRepository) UpdateEmail(id int64, email string) error {
	query := `UPDATE borrower SET 
	          email_address = $1,
	          updated_at = CURRENT_TIMESTAMP
	          WHERE id = $2`
	_, err := r.db.Exec(query, email, id)
	return err
}

// UpdateBorrowerConsentsAndMilitary updates military service status and consents
func (r *BorrowerRepository) UpdateBorrowerConsentsAndMilitary(id int64, militaryServiceStatus, consentToCreditCheck, consentToContact *bool) error {
	query := `UPDATE borrower SET 
	          military_service_status = COALESCE($1, military_service_status),
	          consent_to_credit_check = COALESCE($2, consent_to_credit_check),
	          consent_to_contact = COALESCE($3, consent_to_contact),
	          updated_at = CURRENT_TIMESTAMP
	          WHERE id = $4`
	_, err := r.db.Exec(query, militaryServiceStatus, consentToCreditCheck, consentToContact, id)
	return err
}

// CreateResidence creates a residence record for a borrower
func (r *BorrowerRepository) CreateResidence(borrowerID int64, residencyType, address, city, state, zipCode string) (int64, error) {
	query := `INSERT INTO residence (borrower_id, residency_type, address_line_text, city_name, state_code, postal_code) 
	          VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
	var residenceID int64
	err := r.db.QueryRow(query, borrowerID, residencyType, address, city, state, zipCode).Scan(&residenceID)
	return residenceID, err
}

// GetCurrentResidence retrieves the current residence for a borrower
func (r *BorrowerRepository) GetCurrentResidence(borrowerID int64) (address, city, state, zipCode string, err error) {
	query := `SELECT address_line_text, city_name, state_code, postal_code 
	          FROM residence 
	          WHERE borrower_id = $1 AND residency_type = 'BorrowerCurrentResidence' 
	          ORDER BY id DESC LIMIT 1`
	var addr, c, s, z sql.NullString
	err = r.db.QueryRow(query, borrowerID).Scan(&addr, &c, &s, &z)
	if err != nil {
		if err == sql.ErrNoRows {
			// No residence found - return empty strings but no error
			return "", "", "", "", nil
		}
		return "", "", "", "", err
	}
	if addr.Valid {
		address = addr.String
	}
	if c.Valid {
		city = c.String
	}
	if s.Valid {
		state = s.String
	}
	if z.Valid {
		zipCode = z.String
	}
	return address, city, state, zipCode, nil
}

// GetCurrentResidenceID retrieves the ID of the current residence for a borrower
func (r *BorrowerRepository) GetCurrentResidenceID(borrowerID int64) (int64, error) {
	query := `SELECT id 
	          FROM residence 
	          WHERE borrower_id = $1 AND residency_type = 'BorrowerCurrentResidence' 
	          ORDER BY id DESC LIMIT 1`
	var residenceID int64
	err := r.db.QueryRow(query, borrowerID).Scan(&residenceID)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, nil // No residence found, return 0
		}
		return 0, err
	}
	return residenceID, nil
}

// UpdateOrCreateResidence updates existing residence or creates a new one
func (r *BorrowerRepository) UpdateOrCreateResidence(borrowerID int64, residencyType, address, city, state, zipCode string) error {
	// Check if residence exists
	residenceID, err := r.GetCurrentResidenceID(borrowerID)
	if err != nil {
		return err
	}

	if residenceID > 0 {
		// Update existing residence
		query := `UPDATE residence 
		          SET address_line_text = $1,
		              city_name = $2,
		              state_code = $3,
		              postal_code = $4
		          WHERE id = $5`
		_, err = r.db.Exec(query, address, city, state, zipCode, residenceID)
		return err
	} else {
		// Create new residence
		_, err = r.CreateResidence(borrowerID, residencyType, address, city, state, zipCode)
		return err
	}
}

// Note: deal_id has been removed from borrower table
// Borrowers are linked to deals through the deal.borrower_id relationship or a junction table if needed

// CreateCoBorrower creates a co-borrower record (without email/password since they don't have an account)
func (r *BorrowerRepository) CreateCoBorrower(firstName, lastName, middleName, suffix, email, phone, phoneType, maritalStatus string, isVeteran bool) (int64, error) {
	var borrowerID int64
	
	// Set phone based on phoneType
	var homePhone, mobilePhone, workPhone sql.NullString
	switch phoneType {
	case "HOME":
		homePhone = sql.NullString{String: phone, Valid: true}
	case "MOBILE":
		mobilePhone = sql.NullString{String: phone, Valid: true}
	case "WORK":
		workPhone = sql.NullString{String: phone, Valid: true}
	default:
		mobilePhone = sql.NullString{String: phone, Valid: true} // Default to mobile
	}
	
	// Set marital status (normalize to match database constraint)
	var maritalStatusNull sql.NullString
	if maritalStatus != "" {
		// Normalize to capitalized format: "Married", "Separated", "Unmarried"
		status := strings.ToLower(strings.TrimSpace(maritalStatus))
		if len(status) > 0 {
			normalized := strings.ToUpper(status[:1]) + status[1:]
			maritalStatusNull = sql.NullString{String: normalized, Valid: true}
		}
	}
	
	// Set middle name and suffix
	var middleNameNull, suffixNull sql.NullString
	if middleName != "" {
		middleNameNull = sql.NullString{String: middleName, Valid: true}
	}
	if suffix != "" {
		suffixNull = sql.NullString{String: suffix, Valid: true}
	}
	
	// Set email (nullable since co-borrower may not have account)
	var emailNull sql.NullString
	if email != "" {
		emailNull = sql.NullString{String: email, Valid: true}
	}
	
	// Set military service status
	militaryServiceStatus := sql.NullBool{Bool: isVeteran, Valid: true}
	
	query := `INSERT INTO borrower (first_name, last_name, middle_name, suffix, email_address, 
	          home_phone, mobile_phone, work_phone, marital_status, military_service_status, 
	          created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
	          RETURNING id`
	
	err := r.db.QueryRow(query, firstName, lastName, middleNameNull, suffixNull, emailNull,
		homePhone, mobilePhone, workPhone, maritalStatusNull, militaryServiceStatus).Scan(&borrowerID)
	if err != nil {
		return 0, err
	}
	
	return borrowerID, nil
}

// LinkBorrowerToDeal links a borrower to a deal via borrower_progress table
func (r *BorrowerRepository) LinkBorrowerToDeal(borrowerID, dealID int64) error {
	query := `INSERT INTO borrower_progress (borrower_id, deal_id, created_at, updated_at) 
	          VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	          ON CONFLICT (borrower_id, deal_id) DO NOTHING`
	_, err := r.db.Exec(query, borrowerID, dealID)
	return err
}

// GetCoBorrowersByDealID retrieves all co-borrowers (non-primary) for a deal
func (r *BorrowerRepository) GetCoBorrowersByDealID(dealID, primaryBorrowerID int64) ([]*Borrower, error) {
	query := `SELECT b.id, b.first_name, b.middle_name, b.last_name, b.suffix, 
	                 b.email_address, b.mobile_phone, b.home_phone, b.work_phone,
	                 b.marital_status, b.military_service_status
	          FROM borrower b
	          INNER JOIN borrower_progress bp ON b.id = bp.borrower_id
	          WHERE bp.deal_id = $1 AND b.id != $2
	          ORDER BY bp.created_at ASC`
	
	rows, err := r.db.Query(query, dealID, primaryBorrowerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var borrowers []*Borrower
	for rows.Next() {
		borrower := &Borrower{}
		err := rows.Scan(
			&borrower.ID,
			&borrower.FirstName,
			&borrower.MiddleName,
			&borrower.LastName,
			&borrower.Suffix,
			&borrower.EmailAddress,
			&borrower.MobilePhone,
			&borrower.HomePhone,
			&borrower.WorkPhone,
			&borrower.MaritalStatus,
			&borrower.MilitaryServiceStatus,
		)
		if err != nil {
			return nil, err
		}
		borrowers = append(borrowers, borrower)
	}

	return borrowers, rows.Err()
}
