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

        // Navigation properties
        public ServiceCombo ServiceCombo { get; set; } = null!;
        public Service Service { get; set; } = null!;
    }
}
