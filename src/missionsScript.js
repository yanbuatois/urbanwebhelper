$('.missions-category').click(function(event) {
  const id = this.id.replace('cat-', '');
  $.ajax({
    url: '/ajax/cmissions',
    type: 'GET',
    data: 'categorie=' + id,
    dataType: 'json',
  }).done((data) => {
    console.log(data);
  }).fail((jqXHR, textStatus, err) => {
    console.error(err);
  })
});