using System;
using System.ComponentModel.DataAnnotations;
namespace ESCE_SYSTEM.DTOs.Service
{
    public class UpdateServiceDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public string? Images { get; set; }
    }
}
