using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ESCE_SYSTEM.Models
{
    public class ServiceComboDetail
    {
        public int Id { get; set; }

        // Foreign Key to ServiceCombo
        public int ServicecomboId { get; set; }

        // Foreign Key to Service
        public int ServiceId { get; set; }

        public int Quantity { get; set; } = 1;

        // Navigation properties (nullable to avoid model binding validation issues)
        public ServiceCombo? ServiceCombo { get; set; }
        public Service? Service { get; set; }
    }
}
