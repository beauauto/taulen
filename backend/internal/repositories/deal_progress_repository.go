package repositories

import (
	"database/sql"
	"taulen/backend/internal/database"
)

// DealProgress represents progress tracking for a deal
type DealProgress struct {
	ID                        string
	DealID                    string
	Section1aComplete         bool
	Section1bComplete         bool
	Section1cComplete         bool
	Section1dComplete         bool
	Section1eComplete         bool
	Section2aComplete         bool
	Section2bComplete         bool
	Section2cComplete         bool
	Section2dComplete         bool
	Section3Complete          bool
	Section4Complete          bool
	Section5Complete          bool
	Section6Complete          bool
	Section7Complete          bool
	Section8Complete          bool
	Section9Complete          bool
	LenderL1Complete          bool
	LenderL2Complete          bool
	LenderL3Complete          bool
	LenderL4Complete          bool
	ContinuationComplete      bool
	UnmarriedAddendumComplete bool
	ProgressPercentage        int
	LastUpdatedSection        sql.NullString
	LastUpdatedAt             sql.NullTime
	ProgressNotes             sql.NullString
	CreatedAt                 sql.NullTime
	UpdatedAt                 sql.NullTime
}

// DealProgressRepository handles deal progress data access
type DealProgressRepository struct {
	db *sql.DB
}

// NewDealProgressRepository creates a new deal progress repository
func NewDealProgressRepository() *DealProgressRepository {
	return &DealProgressRepository{
		db: database.DB,
	}
}

// GetByDealID retrieves progress for a deal
func (r *DealProgressRepository) GetByDealID(dealID string) (*DealProgress, error) {
	query := `SELECT id, deal_id, section_1a_complete, section_1b_complete, section_1c_complete,
	          section_1d_complete, section_1e_complete, section_2a_complete, section_2b_complete,
	          section_2c_complete, section_2d_complete, section_3_complete, section_4_complete,
	          section_5_complete, section_6_complete, section_7_complete, section_8_complete,
	          section_9_complete, lender_l1_complete, lender_l2_complete, lender_l3_complete,
	          lender_l4_complete, continuation_complete, unmarried_addendum_complete,
	          progress_percentage, last_updated_section, last_updated_at, progress_notes,
	          created_at, updated_at
	          FROM deal_progress WHERE deal_id = $1`
	
	row := r.db.QueryRow(query, dealID)
	
	progress := &DealProgress{}
	err := row.Scan(
		&progress.ID, &progress.DealID,
		&progress.Section1aComplete, &progress.Section1bComplete, &progress.Section1cComplete,
		&progress.Section1dComplete, &progress.Section1eComplete,
		&progress.Section2aComplete, &progress.Section2bComplete,
		&progress.Section2cComplete, &progress.Section2dComplete,
		&progress.Section3Complete, &progress.Section4Complete,
		&progress.Section5Complete, &progress.Section6Complete,
		&progress.Section7Complete, &progress.Section8Complete,
		&progress.Section9Complete,
		&progress.LenderL1Complete, &progress.LenderL2Complete,
		&progress.LenderL3Complete, &progress.LenderL4Complete,
		&progress.ContinuationComplete, &progress.UnmarriedAddendumComplete,
		&progress.ProgressPercentage, &progress.LastUpdatedSection,
		&progress.LastUpdatedAt, &progress.ProgressNotes,
		&progress.CreatedAt, &progress.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return progress, nil
}

// UpdateSection marks a section as complete or incomplete
func (r *DealProgressRepository) UpdateSection(dealID string, section string, complete bool) error {
	// Map section names to column names
	sectionMap := map[string]string{
		"Section1a_PersonalInfo":        "section_1a_complete",
		"Section1b_CurrentEmployment":    "section_1b_complete",
		"Section1c_AdditionalEmployment": "section_1c_complete",
		"Section1d_PreviousEmployment":   "section_1d_complete",
		"Section1e_OtherIncome":          "section_1e_complete",
		"Section2a_Assets":               "section_2a_complete",
		"Section2b_OtherAssetsCredits":   "section_2b_complete",
		"Section2c_Liabilities":          "section_2c_complete",
		"Section2d_Expenses":             "section_2d_complete",
		"Section3_RealEstateOwned":       "section_3_complete",
		"Section4_LoanPropertyInfo":      "section_4_complete",
		"Section5_Declarations":          "section_5_complete",
		"Section6_Acknowledgments":       "section_6_complete",
		"Section7_MilitaryService":       "section_7_complete",
		"Section8_Demographics":          "section_8_complete",
		"Section9_OriginatorInfo":        "section_9_complete",
		"Lender_L1_PropertyLoanInfo":     "lender_l1_complete",
		"Lender_L2_TitleInfo":            "lender_l2_complete",
		"Lender_L3_MortgageLoanInfo":     "lender_l3_complete",
		"Lender_L4_Qualification":       "lender_l4_complete",
		"ContinuationSheet":              "continuation_complete",
		"UnmarriedAddendum":              "unmarried_addendum_complete",
	}
	
	columnName, ok := sectionMap[section]
	if !ok {
		return sql.ErrNoRows // Invalid section name
	}
	
	query := `UPDATE deal_progress 
	          SET ` + columnName + ` = $1, 
	              last_updated_section = $2,
	              last_updated_at = CURRENT_TIMESTAMP
	          WHERE deal_id = $3`
	
	_, err := r.db.Exec(query, complete, section, dealID)
	return err
}

// UpdateNotes updates progress notes
func (r *DealProgressRepository) UpdateNotes(dealID string, notes string) error {
	query := `UPDATE deal_progress 
	          SET progress_notes = $1, updated_at = CURRENT_TIMESTAMP
	          WHERE deal_id = $2`
	_, err := r.db.Exec(query, notes, dealID)
	return err
}

// GetNextIncompleteSection returns the first incomplete section for resumption
func (r *DealProgressRepository) GetNextIncompleteSection(dealID string) (string, error) {
	progress, err := r.GetByDealID(dealID)
	if err != nil {
		return "", err
	}
	
	// Check sections in order
	sections := []struct {
		section string
		complete bool
	}{
		{"Section1a_PersonalInfo", progress.Section1aComplete},
		{"Section1b_CurrentEmployment", progress.Section1bComplete},
		{"Section1c_AdditionalEmployment", progress.Section1cComplete},
		{"Section1d_PreviousEmployment", progress.Section1dComplete},
		{"Section1e_OtherIncome", progress.Section1eComplete},
		{"Section2a_Assets", progress.Section2aComplete},
		{"Section2b_OtherAssetsCredits", progress.Section2bComplete},
		{"Section2c_Liabilities", progress.Section2cComplete},
		{"Section2d_Expenses", progress.Section2dComplete},
		{"Section3_RealEstateOwned", progress.Section3Complete},
		{"Section4_LoanPropertyInfo", progress.Section4Complete},
		{"Section5_Declarations", progress.Section5Complete},
		{"Section6_Acknowledgments", progress.Section6Complete},
		{"Section7_MilitaryService", progress.Section7Complete},
		{"Section8_Demographics", progress.Section8Complete},
		{"Section9_OriginatorInfo", progress.Section9Complete},
		{"Lender_L1_PropertyLoanInfo", progress.LenderL1Complete},
		{"Lender_L2_TitleInfo", progress.LenderL2Complete},
		{"Lender_L3_MortgageLoanInfo", progress.LenderL3Complete},
		{"Lender_L4_Qualification", progress.LenderL4Complete},
		{"ContinuationSheet", progress.ContinuationComplete},
		{"UnmarriedAddendum", progress.UnmarriedAddendumComplete},
	}
	
	for _, s := range sections {
		if !s.complete {
			return s.section, nil
		}
	}
	
	// All sections complete
	return "", nil
}
