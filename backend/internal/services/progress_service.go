package services

import (
	"taulen/backend/internal/repositories"
)

// ProgressService handles deal progress tracking
type ProgressService struct {
	dealProgressRepo *repositories.DealProgressRepository
}

// NewProgressService creates a new progress service
func NewProgressService() *ProgressService {
	return &ProgressService{
		dealProgressRepo: repositories.NewDealProgressRepository(),
	}
}

// GetDealProgress retrieves progress for a deal
func (s *ProgressService) GetDealProgress(dealID string) (map[string]interface{}, error) {
	progress, err := s.dealProgressRepo.GetByDealID(dealID)
	if err != nil {
		return nil, err
	}

	result := make(map[string]interface{})
	result["dealId"] = progress.DealID
	result["progressPercentage"] = progress.ProgressPercentage
	result["lastUpdatedSection"] = nil
	if progress.LastUpdatedSection.Valid {
		result["lastUpdatedSection"] = progress.LastUpdatedSection.String
	}
	result["lastUpdatedAt"] = nil
	if progress.LastUpdatedAt.Valid {
		result["lastUpdatedAt"] = progress.LastUpdatedAt.Time.Format("2006-01-02T15:04:05Z07:00")
	}
	result["progressNotes"] = nil
	if progress.ProgressNotes.Valid {
		result["progressNotes"] = progress.ProgressNotes.String
	}

	// Section completion flags
	sections := make(map[string]bool)
	sections["section1a"] = progress.Section1aComplete
	sections["section1b"] = progress.Section1bComplete
	sections["section1c"] = progress.Section1cComplete
	sections["section1d"] = progress.Section1dComplete
	sections["section1e"] = progress.Section1eComplete
	sections["section2a"] = progress.Section2aComplete
	sections["section2b"] = progress.Section2bComplete
	sections["section2c"] = progress.Section2cComplete
	sections["section2d"] = progress.Section2dComplete
	sections["section3"] = progress.Section3Complete
	sections["section4"] = progress.Section4Complete
	sections["section5"] = progress.Section5Complete
	sections["section6"] = progress.Section6Complete
	sections["section7"] = progress.Section7Complete
	sections["section8"] = progress.Section8Complete
	sections["section9"] = progress.Section9Complete
	sections["lenderL1"] = progress.LenderL1Complete
	sections["lenderL2"] = progress.LenderL2Complete
	sections["lenderL3"] = progress.LenderL3Complete
	sections["lenderL4"] = progress.LenderL4Complete
	sections["continuation"] = progress.ContinuationComplete
	sections["unmarriedAddendum"] = progress.UnmarriedAddendumComplete
	result["sections"] = sections

	// Get next incomplete section for resumption
	nextSection, err := s.dealProgressRepo.GetNextIncompleteSection(dealID)
	if err == nil {
		result["nextIncompleteSection"] = nextSection
	}

	return result, nil
}

// UpdateDealProgressSection updates a specific section's completion status
func (s *ProgressService) UpdateDealProgressSection(dealID string, section string, complete bool) error {
	return s.dealProgressRepo.UpdateSection(dealID, section, complete)
}

// UpdateDealProgressNotes updates progress notes
func (s *ProgressService) UpdateDealProgressNotes(dealID string, notes string) error {
	return s.dealProgressRepo.UpdateNotes(dealID, notes)
}
